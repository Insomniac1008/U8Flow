"""
Read-only T-SQL firewall and table/view whitelist validator for Yongyou U8 SQL Server.
"""
import fnmatch
import re
from typing import Iterable, List, Set, Tuple

# Keywords strictly forbidden outside string literals in read-only query mode.
FORBIDDEN_KEYWORDS: Set[str] = {
    "INSERT",
    "UPDATE",
    "DELETE",
    "MERGE",
    "DROP",
    "ALTER",
    "CREATE",
    "TRUNCATE",
    "EXEC",
    "EXECUTE",
    "SP_EXECUTESQL",
    "XP_CMDSHELL",
    "OPENROWSET",
    "OPENDATASOURCE",
    "OPENQUERY",
    "OPENXML",
    "BULK",
    "INTO",
    "GRANT",
    "REVOKE",
    "DENY",
    "BACKUP",
    "RESTORE",
    "SHUTDOWN",
    "RECONFIGURE",
    "WAITFOR",
    "DBCC",
    "KILL",
    "USE",
    "SETUSER",
    "WRITETEXT",
    "UPDATETEXT",
    "READTEXT",
    "CHECKPOINT",
    "COMMIT",
    "ROLLBACK",
    "BEGIN",
    "DECLARE",
    "SET",
    "PRINT",
}

FORBIDDEN_PREFIXES = ("XP_", "SP_OA", "SP_CONFIGURE", "SP_ADD", "SP_DROP")


def strip_comments_and_strings(sql: str) -> str:
    """
    Replace SQL comments with spaces and replace string literals ('...' / N'...')
    with empty string placeholders '' so keyword/semicolon/table scanners never
    false-positive on user data values or get bypassed by comments.
    """
    out: List[str] = []
    n = len(sql)
    i = 0
    while i < n:
        ch = sql[i]
        nxt = sql[i + 1] if i + 1 < n else ""

        # Line comment: -- ...
        if ch == "-" and nxt == "-":
            i += 2
            while i < n and sql[i] not in ("\r", "\n"):
                i += 1
            out.append(" ")
            continue

        # Block comment: /* ... */ (supports nesting in T-SQL)
        if ch == "/" and nxt == "*":
            depth = 1
            i += 2
            while i < n and depth > 0:
                if i + 1 < n and sql[i] == "/" and sql[i + 1] == "*":
                    depth += 1
                    i += 2
                elif i + 1 < n and sql[i] == "*" and sql[i + 1] == "/":
                    depth -= 1
                    i += 2
                else:
                    i += 1
            out.append(" ")
            continue

        # Single-quoted string literal (handles '' escape)
        if ch == "'":
            i += 1
            while i < n:
                if sql[i] == "'":
                    if i + 1 < n and sql[i + 1] == "'":
                        i += 2
                        continue
                    i += 1
                    break
                i += 1
            out.append("''")
            continue

        out.append(ch)
        i += 1
    return "".join(out)


def _split_parts(raw: str) -> List[str]:
    parts = []
    for part in raw.strip().split("."):
        p = part.strip()
        if p.startswith("[") and p.endswith("]"):
            p = p[1:-1]
        elif p.startswith('"') and p.endswith('"'):
            p = p[1:-1]
        p = p.strip()
        if p:
            parts.append(p)
    return parts


def _normalize_identifier(raw: str) -> str:
    """
    Normalize a SQL Server table identifier like [dbo].[Inventory]
    or dbo.CurrentStock into bare table/view name without brackets.
    """
    parts = _split_parts(raw)
    if not parts:
        return ""
    return parts[-1]


def _normalize_qualified(raw: str) -> str:
    parts = _split_parts(raw)
    if len(parts) >= 2:
        return f"{parts[-2]}.{parts[-1]}"
    return parts[0] if parts else ""


def extract_cross_db_references(cleaned_sql: str) -> List[str]:
    """Detect 3-part or 4-part cross-database/linked-server table references (db.schema.table)."""
    cross: List[str] = []
    for m in _FROM_JOIN_RE.finditer(cleaned_sql):
        raw = m.group(1)
        if len(_split_parts(raw)) >= 3:
            cross.append(raw.strip())
    return cross


def extract_cte_names(cleaned_sql: str) -> Set[str]:
    """Extract CTE names defined by WITH name [(cols)] AS (...), name2 AS (...)."""
    ctes: Set[str] = set()
    # Matches WITH <name> (...) AS (  and  ), <name> (...) AS (
    pattern = re.compile(
        r"(?:\bWITH\b|,)\s*(\[[^\]]+\]|\"[^\"]+\"|[A-Za-z_#][\w$#]*)\s*(?:\([^)]*\))?\s*\bAS\s*\(",
        re.IGNORECASE,
    )
    for m in pattern.finditer(cleaned_sql):
        name = _normalize_identifier(m.group(1))
        if name:
            ctes.add(name.lower())
    return ctes


_IDENT_PART = r"(?:\[[^\]]+\]|\"[^\"]+\"|[A-Za-z_#][\w$#]*)"
_QUALIFIED_IDENT = rf"{_IDENT_PART}(?:\s*\.\s*{_IDENT_PART}){{0,3}}"

# Match FROM <table_expr> and JOIN <table_expr>
_FROM_JOIN_RE = re.compile(
    rf"\b(?:FROM|JOIN)\s+({_QUALIFIED_IDENT})",
    re.IGNORECASE,
)

# Match comma joins immediately inside a FROM list: FROM a t1, dbo.b t2 WHERE ...
_FROM_BLOCK_RE = re.compile(
    r"\bFROM\s+(.*?)(?=\b(?:WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|UNION|EXCEPT|INTERSECT|OPTION|FOR)\b|\)|$)",
    re.IGNORECASE | re.DOTALL,
)


def extract_referenced_objects(cleaned_sql: str) -> List[str]:
    """
    Extract referenced table/view names (qualified if schema present, else bare)
    excluding CTE aliases and subqueries.
    """
    ctes = extract_cte_names(cleaned_sql)
    found: List[str] = []
    seen: Set[str] = set()

    def _add(raw_ident: str):
        bare = _normalize_identifier(raw_ident)
        qual = _normalize_qualified(raw_ident)
        if not bare:
            return
        low_bare = bare.lower()
        # Ignore SQL keywords accidentally matched (e.g. FROM (SELECT ...) -> regex skips '(')
        if low_bare in ctes or low_bare in {"select", "values", "dual"}:
            return
        if low_bare not in seen:
            seen.add(low_bare)
            found.append(qual)

    for m in _FROM_JOIN_RE.finditer(cleaned_sql):
        _add(m.group(1))

    # Also detect legacy comma-separated FROM tables (e.g., FROM Inventory i, CurrentStock s WHERE ...)
    for block_match in _FROM_BLOCK_RE.finditer(cleaned_sql):
        block = block_match.group(1)
        # Split on top-level commas only (depth 0 parentheses)
        depth = 0
        start = 0
        segments: List[str] = []
        for idx, ch in enumerate(block):
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth = max(0, depth - 1)
            elif ch == "," and depth == 0:
                segments.append(block[start:idx])
                start = idx + 1
        segments.append(block[start:])
        if len(segments) > 1:
            for seg in segments:
                seg_stripped = seg.strip()
                if not seg_stripped or seg_stripped.startswith("("):
                    continue
                first_ident = re.match(rf"^({_QUALIFIED_IDENT})", seg_stripped)
                if first_ident:
                    _add(first_ident.group(1))

    return found


def is_object_allowed(obj_name: str, allowed_patterns: Iterable[str]) -> bool:
    """
    Check if a table/view name matches any whitelist pattern (case-insensitive).
    Supports exact match (`Inventory`, `dbo.Inventory`) and wildcard patterns (`v_u8_*`).
    """
    patterns = [p.strip().lower() for p in allowed_patterns if p and p.strip()]
    if not patterns:
        return False
    bare = _normalize_identifier(obj_name).lower()
    qual = _normalize_qualified(obj_name).lower()
    for pat in patterns:
        pat_bare = _normalize_identifier(pat).lower()
        if fnmatch.fnmatchcase(bare, pat) or fnmatch.fnmatchcase(qual, pat):
            return True
        if "." in pat and fnmatch.fnmatchcase(qual, pat):
            return True
        if "." not in pat and fnmatch.fnmatchcase(bare, pat_bare):
            return True
    return False


def validate_readonly_sql(
    sql: str,
    whitelist_enabled: bool = True,
    allowed_objects: Iterable[str] = (),
) -> Tuple[bool, str, List[str]]:
    """
    Validate that `sql` is a single read-only SELECT (or CTE SELECT) query,
    contains no forbidden write/DDL/exec keywords, and only accesses whitelisted
    tables/views when whitelist_enabled is True.

    Returns: (is_valid, error_message, referenced_objects)
    """
    raw = (sql or "").strip()
    if not raw:
        return False, "SQL 语句不能为空", []

    if len(raw) > 20000:
        return False, "SQL 语句长度超过限制（最大 20,000 字符）", []

    cleaned = strip_comments_and_strings(raw).strip()
    # Allow a single optional trailing semicolon
    if cleaned.endswith(";"):
        cleaned = cleaned[:-1].strip()

    if not cleaned:
        return False, "SQL 语句不能为空（去除注释后无有效内容）", []

    if ";" in cleaned:
        return False, "安全拦截：禁止一次执行多条 SQL 语句（仅允许单条 SELECT 查询）", []

    # Check leading keyword
    first_match = re.match(r"^\s*\(*\s*([A-Za-z_]+)", cleaned)
    if not first_match:
        return False, "无法识别 SQL 语句类型，仅允许 SELECT / WITH 只读查询", []

    first_kw = first_match.group(1).upper()
    if first_kw not in ("SELECT", "WITH"):
        return (
            False,
            f"安全拦截：仅允许只读 SELECT 查询，禁止执行 {first_kw} 语句",
            [],
        )

    # Scan all SQL tokens outside string literals for forbidden keywords
    tokens = re.findall(r"\b[A-Za-z_][A-Za-z0-9_]*\b", cleaned)
    for tok in tokens:
        up = tok.upper()
        if up in FORBIDDEN_KEYWORDS:
            return (
                False,
                f"安全拦截：SQL 包含受限关键字「{up}」，仅允许纯只读查询",
                [],
            )
        for pref in FORBIDDEN_PREFIXES:
            if up.startswith(pref):
                return (
                    False,
                    f"安全拦截：禁止调用系统存储过程「{up}」",
                    [],
                )

    cross_db = extract_cross_db_references(cleaned)
    if cross_db:
        return (
            False,
            f"安全拦截：禁止跨库或跨实例查询（{'、'.join(cross_db)}），请仅查询当前连接账套内的表或视图",
            [],
        )

    referenced = extract_referenced_objects(cleaned)

    if whitelist_enabled:
        allowed_list = [p.strip() for p in (allowed_objects or []) if p and p.strip()]
        if not allowed_list:
            return (
                False,
                "安全拦截：当前连接已启用表/视图白名单，但尚未配置任何允许查询的表或视图（请联系管理员配置）",
                referenced,
            )
        # Allow pure expressions like SELECT 1 / SELECT GETDATE() when no tables referenced
        blocked = [
            obj for obj in referenced if not is_object_allowed(obj, allowed_list)
        ]
        if blocked:
            blocked_str = "、".join(blocked)
            return (
                False,
                f"白名单拦截：表/视图「{blocked_str}」不在允许查询白名单中，请联系团队管理员在连接设置中添加授权",
                referenced,
            )

    return True, "", referenced
