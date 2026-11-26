"""
Built-in Yongyou U8 SQL Server read-only query templates and default whitelist suggestions.
All templates use TOP and WITH (NOLOCK) to protect production ERP performance.
"""

DEFAULT_U8_WHITELIST = [
    "Inventory",
    "InventoryClass",
    "CurrentStock",
    "Warehouse",
    "Customer",
    "CustomerClass",
    "Vendor",
    "VendorClass",
    "Department",
    "Person",
    "code",
    "GL_accsum",
    "GL_accvouch",
    "SO_SOMain",
    "SO_SODetails",
    "PO_Pomain",
    "PO_Podetails",
    "RdRecord01",
    "RdRecords01",
    "RdRecord32",
    "RdRecords32",
    "Ap_CloseBill",
    "Ar_CloseBill",
    "v_u8_*",
]

BUILTIN_U8_TEMPLATES = [
    {
        "id": "tpl-u8-current-stock",
        "name": "存货现存量汇总",
        "category": "库存供应链",
        "description": "查询各仓库当前结存数量与可用量（按仓库与存货编码排序）",
        "sql_text": """SELECT TOP 50
    w.cWhCode AS 仓库编码,
    w.cWhName AS 仓库名称,
    i.cInvCode AS 存货编码,
    i.cInvName AS 存货名称,
    i.cInvStd AS 规格型号,
    cs.iQuantity AS 现存量,
    cs.fAvaQuantity AS 可用量
FROM CurrentStock cs WITH (NOLOCK)
INNER JOIN Inventory i WITH (NOLOCK) ON cs.cInvCode = i.cInvCode
LEFT JOIN Warehouse w WITH (NOLOCK) ON cs.cWhCode = w.cWhCode
WHERE ISNULL(cs.iQuantity, 0) <> 0
ORDER BY w.cWhCode, i.cInvCode""",
    },
    {
        "id": "tpl-u8-inventory",
        "name": "存货档案检索",
        "category": "基础档案",
        "description": "查看存货编码、名称、规格型号、分类与停用状态",
        "sql_text": """SELECT TOP 50
    i.cInvCode AS 存货编码,
    i.cInvName AS 存货名称,
    i.cInvStd AS 规格型号,
    ic.cInvCName AS 存货分类,
    i.cComUnitCode AS 主计量单位,
    i.dSDate AS 启用日期,
    i.dEDate AS 停用日期
FROM Inventory i WITH (NOLOCK)
LEFT JOIN InventoryClass ic WITH (NOLOCK) ON i.cInvCCode = ic.cInvCCode
ORDER BY i.cInvCode""",
    },
    {
        "id": "tpl-u8-customer",
        "name": "客户档案查询",
        "category": "销售往来",
        "description": "查看客户编码、简称、分类、联系人与业务员",
        "sql_text": """SELECT TOP 50
    c.cCusCode AS 客户编码,
    c.cCusName AS 客户名称,
    c.cCusAbbName AS 客户简称,
    cc.cCCName AS 客户分类,
    c.cCusPerson AS 联系人,
    c.cCusPhone AS 联系电话,
    c.iCusCreLine AS 信用额度
FROM Customer c WITH (NOLOCK)
LEFT JOIN CustomerClass cc WITH (NOLOCK) ON c.cCCCode = cc.cCCCode
ORDER BY c.cCusCode""",
    },
    {
        "id": "tpl-u8-vendor",
        "name": "供应商档案查询",
        "category": "采购往来",
        "description": "查看供应商编码、名称、分类与联系方式",
        "sql_text": """SELECT TOP 50
    v.cVenCode AS 供应商编码,
    v.cVenName AS 供应商名称,
    v.cVenAbbName AS 供应商简称,
    vc.cVCName AS 供应商分类,
    v.cVenPerson AS 联系人,
    v.cVenPhone AS 联系电话
FROM Vendor v WITH (NOLOCK)
LEFT JOIN VendorClass vc WITH (NOLOCK) ON v.cVCCode = vc.cVCCode
ORDER BY v.cVenCode""",
    },
    {
        "id": "tpl-u8-gl-balance",
        "name": "总账科目余额汇总",
        "category": "财务总账",
        "description": "查询最新会计期间各科目期初、本期借贷发生额与期末余额",
        "sql_text": """SELECT TOP 50
    g.iyear AS 年度,
    g.iperiod AS 期间,
    g.ccode AS 科目编码,
    c.ccode_name AS 科目名称,
    g.mb AS 期初余额,
    g.md AS 本期借方,
    g.mc AS 本期贷方,
    g.me AS 期末余额
FROM GL_accsum g WITH (NOLOCK)
LEFT JOIN code c WITH (NOLOCK) ON g.ccode = c.ccode AND g.iyear = c.iyear
ORDER BY g.iyear DESC, g.iperiod DESC, g.ccode ASC""",
    },
    {
        "id": "tpl-u8-sales-order",
        "name": "近期销售订单明细",
        "category": "销售往来",
        "description": "查看最近 50 条销售订单单号、日期、客户、物料及含税金额",
        "sql_text": """SELECT TOP 50
    m.cSOCode AS 销售订单号,
    m.dDate AS 订单日期,
    m.cCusCode AS 客户编码,
    m.cCusName AS 客户名称,
    d.cInvCode AS 存货编码,
    d.cInvName AS 存货名称,
    d.iQuantity AS 数量,
    d.iTaxUnitPrice AS 含税单价,
    d.iSum AS 价税合计
FROM SO_SOMain m WITH (NOLOCK)
INNER JOIN SO_SODetails d WITH (NOLOCK) ON m.ID = d.ID
ORDER BY m.dDate DESC, m.ID DESC""",
    },
    {
        "id": "tpl-u8-purchase-order",
        "name": "近期采购订单明细",
        "category": "采购往来",
        "description": "查看最近 50 条采购订单号、供应商、物料与采购金额",
        "sql_text": """SELECT TOP 50
    m.cPOID AS 采购订单号,
    m.dPODate AS 订单日期,
    m.cVenCode AS 供应商编码,
    v.cVenName AS 供应商名称,
    d.cInvCode AS 存货编码,
    i.cInvName AS 存货名称,
    d.iQuantity AS 采购数量,
    d.iTaxPrice AS 含税单价,
    d.iSum AS 价税合计
FROM PO_Pomain m WITH (NOLOCK)
INNER JOIN PO_Podetails d WITH (NOLOCK) ON m.POID = d.POID
LEFT JOIN Vendor v WITH (NOLOCK) ON m.cVenCode = v.cVenCode
LEFT JOIN Inventory i WITH (NOLOCK) ON d.cInvCode = i.cInvCode
ORDER BY m.dPODate DESC, m.POID DESC""",
    },
    {
        "id": "tpl-u8-dept-person",
        "name": "部门与职员档案",
        "category": "基础档案",
        "description": "查看 U8 部门编码、部门名称与在职人员清单",
        "sql_text": """SELECT TOP 100
    d.cDepCode AS 部门编码,
    d.cDepName AS 部门名称,
    p.cPersonCode AS 职员编码,
    p.cPersonName AS 职员姓名
FROM Department d WITH (NOLOCK)
LEFT JOIN Person p WITH (NOLOCK) ON d.cDepCode = p.cDepCode
ORDER BY d.cDepCode, p.cPersonCode""",
    },
]
