(function () {
  if (window.__RAGFLOW_U8_WEAK_GUIDE_MOUNTED__) return;
  window.__RAGFLOW_U8_WEAK_GUIDE_MOUNTED__ = true;

  const STORAGE_COLLAPSED = 'ragflow_u8_guide_collapsed';
  const STORAGE_VISIBLE = 'ragflow_u8_guide_visible';
  const STORAGE_POS = 'ragflow_u8_guide_pos';
  // Mirror RAGFlow's i18next localStorage key ('lng') + legacy fallback ('u8_lang_th')
  const STORAGE_LNG = 'lng';
  const STORAGE_THAI = 'u8_lang_th';

  const STEPS = [
    { key: 'model', labelKey: 'stepModel', route: '/user-setting/model', mod: 'models' },
    { key: 'datasets', labelKey: 'stepDatasets', route: '/datasets', mod: 'datasets' },
    { key: 'chats', labelKey: 'stepChats', route: '/chats', mod: 'chats' },
    { key: 'agents', labelKey: 'stepAgents', route: '/agents', mod: 'agents' },
  ];

  const MOD_META = [
    { key: 'chats', labelKey: 'modChats', route: '/chats' },
    { key: 'searches', labelKey: 'modSearches', route: '/searches' },
    { key: 'datasets', labelKey: 'modDatasets', route: '/datasets' },
    { key: 'files', labelKey: 'modFiles', route: '/files' },
    { key: 'agents', labelKey: 'modAgents', route: '/agents' },
    { key: 'models', labelKey: 'modModels', route: '/user-setting/model' },
  ];

  const LEVEL_ORDER = { none: 0, read: 1, write: 2 };

  // =========================================================================
  // Structured i18n Resource Bundles (mirroring web/src/locales/{zh,en,th})
  // =========================================================================
  const I18N_RESOURCES = {
    zh: {
      pillLabel: 'U8 引导',
      brandLabel: 'U8 弱引导',
      minimize: '稍后再看',
      collapseTitle: '收起浮窗',
      expandTitle: '展开 U8 弱引导',
      dragTitle: '按住可拖动位置',
      stepModel: '1. 配置模型',
      stepDatasets: '2. 建知识库',
      stepChats: '3. 智能问答',
      stepAgents: '4. U8 扩展',
      modChats: '对话',
      modSearches: '搜索',
      modDatasets: '知识库',
      modFiles: '文件',
      modAgents: 'Agent',
      modModels: '模型配置',
      lvNone: '禁止',
      lvRead: '只读',
      lvWrite: '可写',
      navTeamPerm: '团队权限',
      permPageTitle: '团队权限管理',
      permBackBtn: '← 返回原页面',
      permSearchPlaceholder: '搜索姓名 / 工号 / 邮箱 / 部门...',
      permAddMember: '+ 添加成员',
      permAuditLog: '审计日志',
      permExportCsv: '导出 CSV',
      permAllDepts: '全部部门',
      permDeptPrefix: '部门 {{code}}',
      permRenameTip: '自定义部门 {{code}} 的显示名称',
      permRenameLabel: '自定义部门 {{code}} 名称：',
      permRenamePlaceholder: '例如：财务部（留空恢复「部门 {{code}}」）',
      permSaveName: '保存名称',
      permCancel: '取消',
      permBatchLabel: '批量设置当前筛选（{{scope}}）：',
      permBatchAllMods: '全部模块',
      permBatchApply: '批量应用',
      permColMember: '员工 / 部门',
      permColAction: '操作',
      permOwnerBadge: '主负责人',
      permAdminBadge: '管理员',
      permFullAccess: '全部权限',
      permLoading: '正在加载团队成员权限...',
      permEmpty: '没有匹配的成员记录',
      permEditBtn: '编辑',
      permDeleteBtn: '移除',
      permConfirmDelete: '确定移除成员「{{name}} ({{email}})」的权限配置吗？',
      permUpdatedCell: '已更新 {{name}} 的「{{mod}}」为{{level}}',
      permSaveFailed: '保存失败，已回滚原权限',
      permLoadFailed: '加载团队权限列表失败',
      permDeptSaved: '已更新部门 {{code}} 显示名称',
      permDeptSaveFail: '保存部门名称失败',
      permBatchDone: '已批量更新 {{count}} 位成员权限',
      permBatchFail: '批量更新失败',
      permExportDone: '已导出权限配置 CSV',
      permExportFail: '导出失败，请重试',
      permMemberAdded: '已添加成员 {{name}}',
      permMemberUpdated: '已更新成员 {{name}}',
      permMemberDeleted: '已移除成员 {{name}}',
      permOpFailed: '操作失败：{{msg}}',
      memberModalAddTitle: '添加团队成员',
      memberModalEditTitle: '编辑成员信息',
      fieldEmail: '邮箱',
      fieldName: '姓名',
      fieldEmpNo: '工号',
      fieldDept: '部门编号',
      fieldIsAdmin: '设为团队管理员（可管理成员权限）',
      btnSave: '保存',
      btnClose: '关闭',
      auditTitle: '权限变更审计日志',
      auditEmpty: '暂无审计记录',
      auditTime: '时间',
      auditActor: '操作人',
      auditAction: '动作',
      auditTarget: '对象',
      auditDetail: '详情',
      readonlyBanner: '当前「{{mod}}」为只读模式：可浏览与检索，不可新增、修改或删除。',
      readonlyTopPill: '只读模式 · {{mod}} 不可修改',
      lockedModuleToast: '「{{mod}}」区域暂未向您开放，请联系团队负责人开通',
      redirectedToast: '「{{mod}}」区域暂未向您开放，已跳转至可用页面',
      noAccessTitle: '暂无可访问的功能模块',
      noAccessDesc: '当前账号的所有功能区域均已被设为「禁止」状态，请联系团队负责人（蔡爱君）为您开通权限。',
      guideOnToast: '已开启「U8 弱引导」',
      guideOffToast: '已关闭「U8 弱引导」',
      langSwitchedThai: '已切换为 ภาษาไทย',
      quickPromptsTitle: 'U8 高频提问模板（点击填入）',
      quickPromptFilled: '已填入输入框，可直接发送或补充细节',
      quickPromptNoInput: '未找到对话输入框，请先打开一个对话窗口',
      helpTitle: 'InsomniacFlow · U8 使用指南',
      helpSubtitle: '面向用友 U8 团队的知识库问答与权限管控说明',
      helpSec1Title: '1. 快速上手流程',
      helpSec1Items: [
        '普通成员登录后可直接在「对话」中选择 U8 助理提问，并点击引用角标核对原文出处。',
        '支持在对话中上传 U8 导出的 Excel 财务报表，进行同比、环比与异常排查。',
        '在「搜索」页可直接测试关键字 + 向量混合检索，定位制度条款或报错码。',
      ],
      helpSec2Title: '2. 权限级别说明',
      helpSec2Items: [
        '可写（绿）：可正常浏览、检索、创建、上传与修改。',
        '只读（黄）：可浏览与检索，禁止新增、修改或删除操作。',
        '禁止（红）：该模块不对当前账号开放，如需使用请联系负责人开通。',
      ],
      helpSec3Title: '3. 常见问题与联系',
      helpSec3Items: [
        '如需开通知识库维护权限、调整部门归属或反馈知识缺失，请联系团队负责人（蔡爱君）。',
        '右下角「U8 弱引导」可在「设置 → 模型供应商」左侧栏随时开关。',
      ],
      helpMenuRagflow: 'RAGFlow 帮助',
      helpMenuRagflowDesc: '跳转到 RAGFlow 官方文档',
      helpMenuU8: 'InsomniacFlow · U8 指南',
      helpMenuU8Desc: '查看团队使用规范与权限说明',
      githubMenuRagflow: 'RAGFlow GitHub',
      githubMenuRagflowDesc: '感谢 RAGFlow 开源支持',
      githubMenuAuthor: 'Insomniac1008 (IcyFrog)',
      githubMenuAuthorDesc: '作者 Insomniac1008',
    },
    en: {
      pillLabel: 'U8 Guide',
      brandLabel: 'U8 Guide',
      minimize: 'Hide for now',
      collapseTitle: 'Collapse',
      expandTitle: 'Expand U8 Guide',
      dragTitle: 'Drag to move',
      stepModel: '1. Models',
      stepDatasets: '2. Datasets',
      stepChats: '3. Chat Q&A',
      stepAgents: '4. U8 Agents',
      modChats: 'Chats',
      modSearches: 'Search',
      modDatasets: 'Datasets',
      modFiles: 'Files',
      modAgents: 'Agents',
      modModels: 'Models',
      lvNone: 'Blocked',
      lvRead: 'Read-only',
      lvWrite: 'Read/Write',
      navTeamPerm: 'Team RBAC',
      permPageTitle: 'Team Permission Management',
      permBackBtn: '← Back',
      permSearchPlaceholder: 'Search name / ID / email / dept...',
      permAddMember: '+ Add Member',
      permAuditLog: 'Audit Logs',
      permExportCsv: 'Export CSV',
      permAllDepts: 'All Depts',
      permDeptPrefix: 'Dept {{code}}',
      permRenameTip: 'Rename department {{code}}',
      permRenameLabel: 'Custom name for Dept {{code}}:',
      permRenamePlaceholder: 'e.g. Finance (leave empty to reset)',
      permSaveName: 'Save Name',
      permCancel: 'Cancel',
      permBatchLabel: 'Batch update ({{scope}}):',
      permBatchAllMods: 'All Modules',
      permBatchApply: 'Apply Batch',
      permColMember: 'Member / Dept',
      permColAction: 'Actions',
      permOwnerBadge: 'Owner',
      permAdminBadge: 'Admin',
      permFullAccess: 'Full Access',
      permLoading: 'Loading team permissions...',
      permEmpty: 'No matching members found',
      permEditBtn: 'Edit',
      permDeleteBtn: 'Remove',
      permConfirmDelete: 'Remove permission policy for "{{name}} ({{email}})"?',
      permUpdatedCell: 'Updated {{name}} "{{mod}}" to {{level}}',
      permSaveFailed: 'Save failed, reverted change',
      permLoadFailed: 'Failed to load team permissions',
      permDeptSaved: 'Updated display name for Dept {{code}}',
      permDeptSaveFail: 'Failed to save department name',
      permBatchDone: 'Batch updated {{count}} members',
      permBatchFail: 'Batch update failed',
      permExportDone: 'Exported permissions CSV',
      permExportFail: 'Export failed, please retry',
      permMemberAdded: 'Added member {{name}}',
      permMemberUpdated: 'Updated member {{name}}',
      permMemberDeleted: 'Removed member {{name}}',
      permOpFailed: 'Operation failed: {{msg}}',
      memberModalAddTitle: 'Add Team Member',
      memberModalEditTitle: 'Edit Member',
      fieldEmail: 'Email',
      fieldName: 'Name',
      fieldEmpNo: 'Employee ID',
      fieldDept: 'Dept Code',
      fieldIsAdmin: 'Grant Team Admin (can manage permissions)',
      btnSave: 'Save',
      btnClose: 'Close',
      auditTitle: 'Permission Audit Logs',
      auditEmpty: 'No audit records yet',
      auditTime: 'Time',
      auditActor: 'Actor',
      auditAction: 'Action',
      auditTarget: 'Target',
      auditDetail: 'Detail',
      readonlyBanner: '"{{mod}}" is read-only: viewing & search allowed, editing disabled.',
      readonlyTopPill: 'Read-only · {{mod}}',
      lockedModuleToast: '"{{mod}}" is not enabled for your account. Contact the team owner.',
      redirectedToast: '"{{mod}}" is restricted. Redirected to an accessible page.',
      noAccessTitle: 'No Accessible Modules',
      noAccessDesc: 'All modules are currently disabled for your account. Please contact the team owner (Cai Aijun).',
      guideOnToast: 'U8 Guide enabled',
      guideOffToast: 'U8 Guide hidden',
      langSwitchedThai: 'Switched to ภาษาไทย',
      quickPromptsTitle: 'U8 Quick Prompts (click to fill)',
      quickPromptFilled: 'Prompt inserted into chat input',
      quickPromptNoInput: 'Chat input not found. Open a conversation first.',
      helpTitle: 'InsomniacFlow · U8 User Guide',
      helpSubtitle: 'Knowledge Q&A and RBAC guide for the Yongyou U8 team',
      helpSec1Title: '1. Quick Start',
      helpSec1Items: [
        'Pick a U8 assistant in Chats to ask questions and click citations to verify source text.',
        'Upload U8-exported Excel reports in chat for YoY/MoM variance and anomaly analysis.',
        'Use Search to test hybrid keyword + vector retrieval for U8 error codes and policies.',
      ],
      helpSec2Title: '2. Permission Levels',
      helpSec2Items: [
        'Read/Write (Green): Full view, search, create, upload, and edit access.',
        'Read-only (Yellow): View and search only; create/edit/delete blocked.',
        'Blocked (Red): Module hidden/restricted; contact team owner to request access.',
      ],
      helpSec3Title: '3. Support & Contact',
      helpSec3Items: [
        'For dataset maintenance rights or missing U8 docs, contact the team owner (Cai Aijun).',
        'Toggle the floating U8 Guide anytime in Settings → Model Providers.',
      ],
      helpMenuRagflow: 'RAGFlow Docs',
      helpMenuRagflowDesc: 'Open official RAGFlow documentation',
      helpMenuU8: 'InsomniacFlow · U8 Guide',
      helpMenuU8Desc: 'Team usage guide & RBAC legend',
      githubMenuRagflow: 'RAGFlow GitHub',
      githubMenuRagflowDesc: 'Thanks to RAGFlow open-source project',
      githubMenuAuthor: 'Insomniac1008 (IcyFrog)',
      githubMenuAuthorDesc: 'Author Insomniac1008',
    },
    th: {
      pillLabel: 'คู่มือ U8',
      brandLabel: 'คู่มือแนะนำ U8',
      minimize: 'ซ่อนไว้ก่อน',
      collapseTitle: 'ย่อหน้าต่าง',
      expandTitle: 'ขยายคู่มือแนะนำ U8',
      dragTitle: 'กดค้างเพื่อลากตำแหน่ง',
      stepModel: '1. ตั้งค่าโมเดล',
      stepDatasets: '2. ฐานความรู้',
      stepChats: '3. แชทถาม-ตอบ',
      stepAgents: '4. ขยายงาน U8',
      modChats: 'แชท',
      modSearches: 'ค้นหา',
      modDatasets: 'ฐานความรู้',
      modFiles: 'ไฟล์',
      modAgents: 'เอเจนต์',
      modModels: 'โมเดล',
      lvNone: 'ห้ามเข้า',
      lvRead: 'อ่านเท่านั้น',
      lvWrite: 'แก้ไขได้',
      navTeamPerm: 'สิทธิ์ทีม',
      permPageTitle: 'จัดการสิทธิ์สมาชิกทีม',
      permBackBtn: '← กลับหน้าเดิม',
      permSearchPlaceholder: 'ค้นหาชื่อ / รหัสพนักงาน / อีเมล / แผนก...',
      permAddMember: '+ เพิ่มสมาชิก',
      permAuditLog: 'บันทึกประวัติ',
      permExportCsv: 'ส่งออก CSV',
      permAllDepts: 'ทุกแผนก',
      permDeptPrefix: 'แผนก {{code}}',
      permRenameTip: 'ตั้งชื่อแสดงผลของแผนก {{code}}',
      permRenameLabel: 'ตั้งชื่อแผนก {{code}}:',
      permRenamePlaceholder: 'เช่น ฝ่ายบัญชี (เว้นว่างเพื่อคืนค่าเดิม)',
      permSaveName: 'บันทึกชื่อ',
      permCancel: 'ยกเลิก',
      permBatchLabel: 'ตั้งค่าแบบกลุ่ม ({{scope}}):',
      permBatchAllMods: 'ทุกโมดูล',
      permBatchApply: 'ใช้กับกลุ่ม',
      permColMember: 'พนักงาน / แผนก',
      permColAction: 'จัดการ',
      permOwnerBadge: 'หัวหน้าทีม',
      permAdminBadge: 'ผู้ดูแล',
      permFullAccess: 'เต็มสิทธิ์',
      permLoading: 'กำลังโหลดข้อมูลสิทธิ์ทีม...',
      permEmpty: 'ไม่พบรายชื่อสมาชิกที่ตรงกัน',
      permEditBtn: 'แก้ไข',
      permDeleteBtn: 'ลบ',
      permConfirmDelete: 'ยืนยันการลบสิทธิ์ของ "{{name}} ({{email}})" หรือไม่?',
      permUpdatedCell: 'อัปเดตสิทธิ์ "{{mod}}" ของ {{name}} เป็น {{level}} แล้ว',
      permSaveFailed: 'บันทึกไม่สำเร็จ ระบบคืนค่าเดิมแล้ว',
      permLoadFailed: 'โหลดรายการสิทธิ์ทีมไม่สำเร็จ',
      permDeptSaved: 'อัปเดตชื่อแผนก {{code}} แล้ว',
      permDeptSaveFail: 'บันทึกชื่อแผนกไม่สำเร็จ',
      permBatchDone: 'อัปเดตสิทธิ์สมาชิก {{count}} คนแล้ว',
      permBatchFail: 'อัปเดตแบบกลุ่มไม่สำเร็จ',
      permExportDone: 'ส่งออกไฟล์ CSV เรียบร้อยแล้ว',
      permExportFail: 'ส่งออกไม่สำเร็จ กรุณาลองใหม่',
      permMemberAdded: 'เพิ่มสมาชิก {{name}} แล้ว',
      permMemberUpdated: 'อัปเดตข้อมูล {{name}} แล้ว',
      permMemberDeleted: 'ลบสมาชิก {{name}} แล้ว',
      permOpFailed: 'ดำเนินการไม่สำเร็จ: {{msg}}',
      memberModalAddTitle: 'เพิ่มสมาชิกทีม',
      memberModalEditTitle: 'แก้ไขข้อมูลสมาชิก',
      fieldEmail: 'อีเมล',
      fieldName: 'ชื่อ',
      fieldEmpNo: 'รหัสพนักงาน',
      fieldDept: 'รหัสแผนก',
      fieldIsAdmin: 'ตั้งเป็นผู้ดูแลทีม (จัดการสิทธิ์สมาชิกได้)',
      btnSave: 'บันทึก',
      btnClose: 'ปิด',
      auditTitle: 'บันทึกการเปลี่ยนแปลงสิทธิ์',
      auditEmpty: 'ยังไม่มีประวัติการเปลี่ยนแปลง',
      auditTime: 'เวลา',
      auditActor: 'ผู้ดำเนินการ',
      auditAction: 'การกระทำ',
      auditTarget: 'เป้าหมาย',
      auditDetail: 'รายละเอียด',
      readonlyBanner: 'โหมดอ่านอย่างเดียวสำหรับ "{{mod}}": ดูและค้นหาได้ แต่ไม่สามารถเพิ่ม แก้ไข หรือลบได้',
      readonlyTopPill: 'อ่านอย่างเดียว · {{mod}}',
      lockedModuleToast: 'พื้นที่ "{{mod}}" ยังไม่เปิดให้ใช้งาน กรุณาติดต่อหัวหน้าทีม',
      redirectedToast: 'พื้นที่ "{{mod}}" ยังไม่เปิดให้ใช้งาน กำลังย้ายไปยังหน้าที่ใช้งานได้',
      noAccessTitle: 'ยังไม่มีโมดูลที่สามารถเข้าถึงได้',
      noAccessDesc: 'ทุกพื้นที่การใช้งานของบัญชีนี้ถูกปิดไว้ กรุณาติดต่อหัวหน้าทีม (Cai Aijun) เพื่อเปิดสิทธิ์',
      guideOnToast: 'เปิดคู่มือแนะนำ U8 แล้ว',
      guideOffToast: 'ซ่อนคู่มือแนะนำ U8 แล้ว',
      langSwitchedThai: 'เปลี่ยนภาษาเป็น ภาษาไทย แล้ว',
      quickPromptsTitle: 'คำถามด่วน U8 (คลิกเพื่อใส่ข้อความ)',
      quickPromptFilled: 'ใส่ข้อความลงในช่องแชทแล้ว',
      quickPromptNoInput: 'ไม่พบช่องพิมพ์แชท กรุณาเปิดห้องสนทนาก่อน',
      helpTitle: 'คู่มือการใช้งาน InsomniacFlow · U8',
      helpSubtitle: 'คู่มือการใช้งานฐานความรู้และการจัดการสิทธิ์สำหรับทีม Yongyou U8',
      helpSec1Title: '1. เริ่มต้นใช้งานอย่างรวดเร็ว',
      helpSec1Items: [
        'เลือกผู้ช่วย U8 ในหน้าแชทเพื่อถามคำถาม และคลิกหมายเลขอ้างอิงเพื่อตรวจสอบเอกสารต้นฉบับ',
        'สามารถอัปโหลดรายงาน Excel จาก U8 ในแชทเพื่อช่วยวิเคราะห์เปรียบเทียบและตรวจสอบความผิดปกติ',
        'ใช้หน้าค้นหาเพื่อทดสอบการค้นหาแบบผสมสำหรับรหัสข้อผิดพลาดและนโยบายบัญชี',
      ],
      helpSec2Title: '2. ระดับสิทธิ์การใช้งาน',
      helpSec2Items: [
        'แก้ไขได้ (สีเขียว): ดู ค้นหา สร้าง อัปโหลด และแก้ไขได้ทั้งหมด',
        'อ่านเท่านั้น (สีเหลือง): ดูและค้นหาได้ ห้ามเพิ่ม แก้ไข หรือลบ',
        'ห้ามเข้า (สีแดง): ปิดการเข้าถึงโมดูลนี้ กรุณาติดต่อหัวหน้าทีมหากต้องการใช้งาน',
      ],
      helpSec3Title: '3. ติดต่อสอบถาม',
      helpSec3Items: [
        'หากต้องการขอสิทธิ์จัดการฐานความรู้หรือแจ้งเอกสารขาดหาย ติดต่อหัวหน้าทีม (Cai Aijun)',
        'เปิด/ปิดคู่มือแนะนำ U8 ได้ทุกเมื่อที่ ตั้งค่า → ผู้ให้บริการโมเดล',
      ],
      helpMenuRagflow: 'เอกสาร RAGFlow',
      helpMenuRagflowDesc: 'เปิดเอกสารอย่างเป็นทางการของ RAGFlow',
      helpMenuU8: 'คู่มือ InsomniacFlow · U8',
      helpMenuU8Desc: 'ดูแนวทางการใช้งานทีมและระดับสิทธิ์',
      githubMenuRagflow: 'RAGFlow GitHub',
      githubMenuRagflowDesc: 'ขอบคุณโครงการโอเพนซอร์ส RAGFlow',
      githubMenuAuthor: 'Insomniac1008 (IcyFrog)',
      githubMenuAuthorDesc: 'ผู้พัฒนา Insomniac1008',
    },
  };

  // U8 Quick Prompt templates shown on /chats
  const U8_QUICK_PROMPTS = {
    zh: [
      { label: '月末结账报错', text: '我在用友 U8 月末结账时遇到报错，请帮我按模块（总账/存货/应收应付）列出常见排查步骤与核对清单。' },
      { label: '财务报表分析', text: '请帮我分析我上传的 U8 财务报表，重点对比本期与上期的同比、环比变化，并指出异常波动科目。' },
      { label: '存货核算差异', text: '用友 U8 存货核算与总账对账出现差异，请提供标准的差异定位步骤和常见原因。' },
      { label: '单据核销异常', text: '用友 U8 应收/应付单据核销失败或余额不平，请给出排查流程与注意事项。' },
    ],
    en: [
      { label: 'Month-end Close', text: 'I encountered an error during Yongyou U8 month-end closing. Please provide a step-by-step checklist across GL, Inventory, and AR/AP.' },
      { label: 'Report Variance', text: 'Please analyze the uploaded U8 financial report, compare YoY/MoM changes, and highlight unusual account variances.' },
      { label: 'Inventory Recon', text: 'There is a reconciliation difference between U8 Inventory Accounting and General Ledger. What are the standard troubleshooting steps?' },
      { label: 'AR/AP Write-off', text: 'AR/AP document write-off failed or balances do not match in U8. Please provide troubleshooting steps.' },
    ],
    th: [
      { label: 'ปิดบัญชีสิ้นเดือน', text: 'พบข้อผิดพลาดระหว่างปิดบัญชีสิ้นเดือนใน Yongyou U8 กรุณาสรุปขั้นตอนตรวจสอบแยกตามโมดูล (GL/สินค้าคงคลัง/ลูกหนี้เจ้าหนี้)' },
      { label: 'วิเคราะห์งบการเงิน', text: 'ช่วยวิเคราะห์รายงานการเงิน U8 ที่อัปโหลด เปรียบเทียบ YoY/MoM และชี้รายการที่ผิดปกติ' },
      { label: 'กระทบยอดสินค้า', text: 'พบผลต่างระหว่างบัญชีสินค้าคงคลังกับบัญชีแยกประเภททั่วไปใน U8 ขอขั้นตอนตรวจสอบมาตรฐาน' },
      { label: 'ตัดยอดเอกสาร', text: 'การตัดยอดเอกสารลูกหนี้/เจ้าหนี้ใน U8 ไม่สำเร็จหรือยอดไม่ตรง ขอแนวทางตรวจสอบและแก้ไข' },
    ],
  };

  // RAGFlow built-in DOM text translation dictionary for Thai mode
  const THAI_DICT = {
    '首页': 'หน้าแรก', 'Home': 'หน้าแรก',
    '知识库': 'ฐานความรู้', 'Dataset': 'ฐานความรู้', 'Datasets': 'ฐานความรู้', 'Knowledge Base': 'ฐานความรู้',
    '聊天': 'แชท', '对话': 'แชท', 'Chat': 'แชท', 'Chats': 'แชท',
    '搜索': 'ค้นหา', 'Search': 'ค้นหา', 'Searches': 'ค้นหา',
    '智能体': 'เอเจนต์', 'Agent': 'เอเจนต์', 'Agents': 'เอเจนต์',
    '记忆': 'หน่วยความจำ', 'Memory': 'หน่วยความจำ', 'Memories': 'หน่วยความจำ',
    '文件管理': 'จัดการไฟล์', 'File Management': 'จัดการไฟล์', 'Files': 'จัดการไฟล์',
    '团队权限': 'สิทธิ์ทีม',
    '模型供应商': 'ผู้ให้บริการโมเดล', 'Model providers': 'ผู้ให้บริการโมเดล', 'Model Providers': 'ผู้ให้บริการโมเดล',
    '数据源': 'แหล่งข้อมูล', 'Data Sources': 'แหล่งข้อมูล', 'Data sources': 'แหล่งข้อมูล',
    '聊天渠道': 'ช่องทางแชท', 'Chat Channels': 'ช่องทางแชท',
    '团队': 'ทีม', 'Team': 'ทีม',
    '概要': 'โปรไฟล์', 'Profile': 'โปรไฟล์',
    '决策模型': 'โมเดลการตัดสินใจ', 'Decision Model': 'โมเดลการตัดสินใจ',
    '系统模型设置': 'ตั้งค่าโมเดลระบบ', 'System Model Settings': 'ตั้งค่าโมเดลระบบ',
    '设置默认模型': 'ตั้งค่าโมเดลเริ่มต้น', 'Set default models': 'ตั้งค่าโมเดลเริ่มต้น',
    '添加模型': 'เพิ่มโมเดล', 'Add the model': 'เพิ่มโมเดล',
    '待添加的模型': 'โมเดลที่พร้อมเพิ่ม', '已添加的模型': 'โมเดลที่เพิ่มแล้ว',
    '创建知识库': 'สร้างฐานความรู้', 'Create knowledge base': 'สร้างฐานความรู้',
    '新建助理': 'สร้างผู้ช่วยใหม่', '创建聊天': 'สร้างแชท', 'Create chat': 'สร้างแชท',
    '上传文件': 'อัปโหลดไฟล์', 'Upload file': 'อัปโหลดไฟล์', 'Upload': 'อัปโหลด',
    '保存': 'บันทึก', 'Save': 'บันทึก',
    '取消': 'ยกเลิก', 'Cancel': 'ยกเลิก',
    '确认': 'ยืนยัน', 'Confirm': 'ยืนยัน',
    '确定': 'ตกลง', 'OK': 'ตกลง',
    '删除': 'ลบ', 'Delete': 'ลบ',
    '编辑': 'แก้ไข', 'Edit': 'แก้ไข',
    '设置': 'ตั้งค่า', 'Settings': 'ตั้งค่า',
    '登录': 'เข้าสู่ระบบ', 'Sign in': 'เข้าสู่ระบบ', 'Login': 'เข้าสู่ระบบ',
    '注册': 'สมัครสมาชิก', 'Sign up': 'สมัครสมาชิก',
    '退出登录': 'ออกจากระบบ', 'Log out': 'ออกจากระบบ', 'Logout': 'ออกจากระบบ',
    '邮箱': 'อีเมล', 'Email': 'อีเมล',
    '密码': 'รหัสผ่าน', 'Password': 'รหัสผ่าน',
    '名称': 'ชื่อ', 'Name': 'ชื่อ',
    '描述': 'คำอธิบาย', 'Description': 'คำอธิบาย',
    '权限': 'สิทธิ์การใช้งาน', 'Permissions': 'สิทธิ์การใช้งาน',
    '仅自己': 'ส่วนตัวเท่านั้น', 'Only me': 'ส่วนตัวเท่านั้น',
    '解析': 'วิเคราะห์เอกสาร', 'Parse': 'วิเคราะห์เอกสาร',
    '全部': 'ทั้งหมด', 'All': 'ทั้งหมด',
    '新建文件夹': 'สร้างโฟลเดอร์ใหม่', 'New folder': 'สร้างโฟลเดอร์ใหม่',
    '下载': 'ดาวน์โหลด', 'Download': 'ดาวน์โหลด',
    '重命名': 'เปลี่ยนชื่อ', 'Rename': 'เปลี่ยนชื่อ',
    '发送': 'ส่ง', 'Send': 'ส่ง',
    '复制': 'คัดลอก', 'Copy': 'คัดลอก',
    '刷新': 'รีเฟรช', 'Refresh': 'รีเฟรช',
    '返回': 'กลับ', 'Back': 'กลับ',
    '下一步': 'ถัดไป', 'Next': 'ถัดไป',
    '上一步': 'ก่อนหน้า', 'Previous': 'ก่อนหน้า',
    '状态': 'สถานะ', 'Status': 'สถานะ',
    '创建时间': 'เวลาสร้าง', 'Create Time': 'เวลาสร้าง',
    '更新时间': 'เวลาอัปเดต', 'Update Time': 'เวลาอัปเดต',
    '操作': 'การดำเนินการ', 'Action': 'การดำเนินการ',
    'U8 引导': 'คู่มือ U8', 'U8 弱引导': 'คู่มือแนะนำ U8',
  };

  // WeakMap to preserve original text nodes when switching to Thai so switching back restores cleanly
  const ORIGINAL_TEXT_MAP = new WeakMap();

  function getCurrentLang() {
    try {
      const htmlLang = (document.documentElement.lang || '').toLowerCase();
      const storedLng = (localStorage.getItem(STORAGE_LNG) || '').toLowerCase();
      const legacyThai = localStorage.getItem(STORAGE_THAI) === '1';
      if (htmlLang === 'th' || storedLng === 'th' || legacyThai) return 'th';
      const active = htmlLang || storedLng;
      if (active.startsWith('en')) return 'en';
      return 'zh';
    } catch (_) {
      return 'zh';
    }
  }

  function isThaiMode() {
    return getCurrentLang() === 'th';
  }

  function t(key, vars) {
    const lang = getCurrentLang();
    const dict = I18N_RESOURCES[lang] || I18N_RESOURCES.zh;
    let val = dict[key] !== undefined ? dict[key] : I18N_RESOURCES.zh[key];
    if (typeof val !== 'string') return val !== undefined ? val : key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        val = val.replace(new RegExp('\\{\\{' + k + '\\}\\}', 'g'), String(vars[k]));
      });
    }
    return val;
  }

  function getLevelLabel(lv) {
    if (lv === 'none') return t('lvNone');
    if (lv === 'write') return t('lvWrite');
    return t('lvRead');
  }

  function getModLabel(modKey) {
    const meta = MOD_META.find((m) => m.key === modKey);
    return meta ? t(meta.labelKey) : modKey;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isGuideVisible() {
    try {
      const v = localStorage.getItem(STORAGE_VISIBLE);
      return v === null ? true : v === '1';
    } catch (_) {
      return true;
    }
  }

  function routeToModule(pathname) {
    const p = (pathname || '/').toLowerCase();
    if (p.startsWith('/chats') || p.startsWith('/chat')) return 'chats';
    if (p.startsWith('/searches') || p.startsWith('/search')) return 'searches';
    if (p.startsWith('/datasets') || p.startsWith('/dataset') || p.startsWith('/chunk')) return 'datasets';
    if (p.startsWith('/files')) return 'files';
    if (p.startsWith('/agents') || p.startsWith('/agent') || p.startsWith('/pipeline')) return 'agents';
    if (p.includes('/model')) return 'models';
    return null;
  }

  function getRouteGuide(pathname) {
    const p = (pathname || '/').toLowerCase();
    const lang = getCurrentLang();

    if (p.startsWith('/login')) {
      return {
        step: 'model',
        tag: lang === 'th' ? 'เข้าสู่ระบบ' : lang === 'en' ? 'Sign In' : '首次登录',
        title:
          lang === 'th'
            ? 'ยินดีต้อนรับสู่ InsomniacFlow (U8)'
            : lang === 'en'
              ? 'Welcome to InsomniacFlow · U8'
              : '欢迎使用 InsomniacFlow · U8 助手',
        tips:
          lang === 'th'
            ? [
                'บัญชีพนักงานคือ "pinyin@u8.local" และรหัสผ่านเริ่มต้นคือชื่อพินอิน',
                'เข้าสู่ระบบแล้วสามารถใช้งานฐานความรู้ U8 ที่ทีมแชร์ไว้ได้ทันที',
              ]
            : lang === 'en'
              ? [
                  'Employee accounts follow "pinyin@u8.local"; please change your initial password after login.',
                  'Once signed in, you can immediately query the shared U8 team knowledge base.',
                ]
              : [
                  '员工账号为「姓名拼音@u8.local」，初始密码为姓名拼音，建议登录后自行修改密码。',
                  '登录后即可直接使用团队共享的 U8 知识库进行问答与检索。',
                ],
        action: null,
      };
    }

    if (p.includes('/model') || p.includes('/profile-setting') || p.includes('/user-setting')) {
      return {
        step: 'model',
        tag: lang === 'th' ? 'ขั้นตอน 1 / 4' : lang === 'en' ? 'Step 1 / 4' : '步骤 1 / 4',
        title:
          lang === 'th'
            ? 'เชื่อมต่อ API โมเดลภายนอก'
            : lang === 'en'
              ? 'Configure External Model APIs'
              : '优先接入外部模型 API',
        tips:
          lang === 'th'
            ? [
                'ตั้งค่าโมเดลที่จำเป็น (LLM, Embedding, VLM, ASR, Rerank, TTS, โมเดลการตัดสินใจ)',
                'เปิด/ปิดคู่มือแนะนำ U8 ได้จากสวิตช์ที่แถบเมนูด้านซ้าย',
              ]
            : lang === 'en'
              ? [
                  'Configure default system models (LLM, Embedding, VLM, ASR, Rerank, TTS, Decision Model).',
                  'Toggle this U8 Guide anytime via the switch on the left settings sidebar.',
                ]
              : [
                  '请完整配置系统默认模型（LLM、Embedding、VLM、ASR、Rerank、TTS、决策模型均为必填项）。',
                  '可在左侧导航栏底部的滑动开关随时控制「U8 弱引导」的显示或隐藏。',
                ],
        action: {
          label: lang === 'th' ? 'ถัดไป: ฐานความรู้' : lang === 'en' ? 'Next: Datasets' : '下一步：去建知识库',
          route: '/datasets',
        },
      };
    }

    if (p.startsWith('/datasets') || p.startsWith('/dataset') || p.startsWith('/chunk')) {
      return {
        step: 'datasets',
        tag: lang === 'th' ? 'ขั้นตอน 2 / 4' : lang === 'en' ? 'Step 2 / 4' : '步骤 2 / 4',
        title:
          lang === 'th'
            ? 'สร้างฐานความรู้ U8 v18.000'
            : lang === 'en'
              ? 'Build U8 v18.000 Knowledge Base'
              : '构建 U8 v18.000 知识库',
        tips:
          lang === 'th'
            ? [
                'แยกฐานความรู้ตามโมดูล เช่น คู่มือ U8, การปิดบัญชีสิ้นเดือน, นโยบายบัญชี',
                'ตั้งค่าสิทธิ์เป็น "ทีม" เพื่อให้สมาชิกทุกคนใช้งานร่วมกันได้',
              ]
            : lang === 'en'
              ? [
                  'Organize datasets by module: U8 Manuals, Month-end Closing, Tax & Finance Policies.',
                  'Use "Manual" chunking for guides, "Table" for spreadsheets, and set permission to "Team".',
                ]
              : [
                  '可按模块拆分知识库：如「U8 操作手册」「月末结账排查」「企业财税制度」。',
                  '操作手册推荐选「Manual」模板，财务表格推荐「Table」模板，权限设为「团队」即可共享。',
                ],
        action: {
          label: lang === 'th' ? 'ถัดไป: แชทถาม-ตอบ' : lang === 'en' ? 'Next: Chat Q&A' : '下一步：创建对话助手',
          route: '/chats',
        },
      };
    }

    if (p.startsWith('/chats') || p.startsWith('/chat')) {
      return {
        step: 'chats',
        tag: lang === 'th' ? 'ขั้นตอน 3 / 4' : lang === 'en' ? 'Step 3 / 4' : '步骤 3 / 4',
        title:
          lang === 'th'
            ? 'ถาม-ตอบและตรวจสอบแหล่งอ้างอิง'
            : lang === 'en'
              ? 'U8 Knowledge Q&A with Citations'
              : '开始 U8 知识问答与溯源',
        tips:
          lang === 'th'
            ? [
                'เลือกผู้ช่วยที่เชื่อมฐานความรู้ U8 แล้วเริ่มถามคำถามพร้อมดูแหล่งอ้างอิงได้ทันที',
                'รองรับการอัปโหลดรายงาน Excel จาก U8 เพื่อช่วยวิเคราะห์เปรียบเทียบ',
              ]
            : lang === 'en'
              ? [
                  'Select a U8 assistant to ask questions and click citation badges to verify sources.',
                  'Upload Excel reports exported from U8 for instant YoY/MoM and anomaly analysis.',
                ]
              : [
                  '选择已关联 U8 知识库的助理发起提问，可点击引用角标核对原文出处。',
                  '支持上传从 U8 导出的 Excel 财务报表，结合对话快速做同比、环比与异常解读。',
                ],
        action: {
          label: lang === 'th' ? 'ทดสอบการค้นหา' : lang === 'en' ? 'Try Search Test' : '查看检索测试',
          route: '/searches',
        },
        showQuickPrompts: true,
      };
    }

    if (p.startsWith('/agents') || p.startsWith('/agent') || p.startsWith('/pipeline')) {
      return {
        step: 'agents',
        tag: lang === 'th' ? 'ขั้นตอน 4 / 4' : lang === 'en' ? 'Step 4 / 4' : '步骤 4 / 4',
        title:
          lang === 'th'
            ? 'ออกแบบเวิร์กโฟลว์ U8 ขั้นสูง'
            : lang === 'en'
              ? 'Orchestrate U8 Workflows'
              : '编排 U8 进阶业务工作流',
        tips:
          lang === 'th'
            ? [
                'เชื่อมต่อ OCR เอกสาร การตรวจสอบใบแจ้งหนี้ และการกระทบยอดผ่าน MCP / HTTP',
                'แนะนำให้เชื่อมต่อ SQL View แบบอ่านอย่างเดียวเพื่อความปลอดภัยของข้อมูล U8',
              ]
            : lang === 'en'
              ? [
                  'Connect invoice OCR, XML/OFD parsers, and 3-way matching via MCP / HTTP nodes.',
                  'Use read-only U8 SQL views for month-end reconciliation diagnostics.',
                ]
              : [
                  '可通过 MCP / HTTP 节点接入票据 OCR、数电票 XML/OFD 解析与三单匹配规则。',
                  '月末对账诊断建议对接 U8 只读 SQL 视图，由确定性规则计算差异、LLM 生成排查报告。',
                ],
        action: {
          label: lang === 'th' ? 'กลับไปที่แชท' : lang === 'en' ? 'Back to Chats' : '返回对话问答',
          route: '/chats',
        },
      };
    }

    if (p.startsWith('/searches') || p.startsWith('/search')) {
      return {
        step: 'chats',
        tag: lang === 'th' ? 'ทดสอบค้นหา' : lang === 'en' ? 'Retrieval Test' : '检索测试',
        title:
          lang === 'th'
            ? 'ทดสอบความแม่นยำการค้นหา'
            : lang === 'en'
              ? 'Verify U8 Recall Accuracy'
              : '快速验证 U8 知识召回效果',
        tips:
          lang === 'th'
            ? ['ป้อนคำสำคัญหรือรหัสข้อผิดพลาดของ U8 เพื่อตรวจสอบความแม่นยำในการค้นหา']
            : lang === 'en'
              ? ['Enter U8 error keywords or policy clauses to test hybrid vector + keyword retrieval.']
              : [
                  '输入常见 U8 报错关键字或制度条款，测试混合检索（向量 + 关键词）的命中准确度。',
                  '如需调整切片规则或重排模型，可联系团队负责人处理。',
                ],
        action: {
          label: lang === 'th' ? 'ไปที่แชท' : lang === 'en' ? 'Go to Chats' : '前往对话问答',
          route: '/chats',
        },
      };
    }

    if (p.startsWith('/files')) {
      return {
        step: 'datasets',
        tag: lang === 'th' ? 'จัดการไฟล์' : lang === 'en' ? 'Files' : '文件管理',
        title:
          lang === 'th'
            ? 'จัดการเอกสารและไฟล์ U8'
            : lang === 'en'
              ? 'Manage U8 Docs & Files'
              : '集中管理 U8 文档与单据资料',
        tips:
          lang === 'th'
            ? ['จัดเก็บไฟล์แยกตามโฟลเดอร์เพื่อนำไปเชื่อมโยงกับฐานความรู้หลายชุดได้']
            : lang === 'en'
              ? ['Archive files by folder and link them across multiple U8 datasets.']
              : ['此处文件可按文件夹分类归档，并关联到多个 U8 业务知识库中复用。'],
        action: {
          label: lang === 'th' ? 'ไปที่แชท' : lang === 'en' ? 'Go to Chats' : '前往对话问答',
          route: '/chats',
        },
      };
    }

    return {
      step: 'chats',
      tag: lang === 'th' ? 'เริ่มต้นใช้งาน' : lang === 'en' ? 'Quick Start' : '快速上手',
      title:
        lang === 'th'
          ? 'คู่มือแนะนำการใช้งาน U8'
          : lang === 'en'
            ? 'Yongyou U8 Team Guide'
            : '用友 U8 知识库弱引导',
      tips:
        lang === 'th'
          ? [
              'สมาชิกทั่วไปใช้งานแชทและค้นหาได้ทันที ส่วนฐานความรู้/โมเดลถูกป้องกันแบบอ่านอย่างเดียว',
              'สามารถซ่อนคู่มือนี้ได้ในหน้าตั้งค่าผู้ให้บริการโมเดล (แถบด้านซ้าย)',
            ]
          : lang === 'en'
            ? [
                'Members have Chat & Search enabled by default; Datasets/Files/Agents/Models are read-only.',
                'Toggle this guide anytime in Settings → Model Providers.',
              ]
            : [
                '普通成员默认开放「对话 + 搜索」，知识库/文件/Agent/模型配置默认只读保护。',
                '可在「设置 → 模型供应商」左侧栏滑动开关随时控制本引导的显示或隐藏。',
              ],
      action: {
        label: lang === 'th' ? 'ไปที่แชทถาม-ตอบ' : lang === 'en' ? 'Go to Chats' : '前往智能问答',
        route: '/chats',
      },
    };
  }

  function navigateTo(route) {
    if (!route) return;
    if (window.location.pathname === route) return;
    try {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (_) {
      window.location.href = route;
    }
  }

  function getAuthToken() {
    try {
      return localStorage.getItem('Authorization') || '';
    } catch (_) {
      return '';
    }
  }

  async function rbacFetch(path, options) {
    const token = getAuthToken();
    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      token ? { Authorization: token } : {},
      (options && options.headers) || {},
    );
    const resp = await fetch('/u8-rbac-api' + path, Object.assign({}, options || {}, { headers }));
    const data = await resp.json().catch(() => ({}));
    return { status: resp.status, data };
  }

  // Fill text into RAGFlow's React-controlled chat textarea
  function fillChatInput(text) {
    const selectors = [
      'textarea[placeholder]',
      'main textarea',
      'textarea',
      '[contenteditable="true"][role="textbox"]',
    ];
    let target = null;
    for (const sel of selectors) {
      const list = Array.from(document.querySelectorAll(sel)).filter((el) => {
        if (el.closest('#ragflow-u8-weak-guide-host') || el.closest('#ragflow-u8-modal-host')) return false;
        const r = el.getBoundingClientRect();
        return r.width > 120 && r.height > 20;
      });
      if (list.length) {
        target = list[list.length - 1];
        break;
      }
    }
    if (!target) return false;
    target.focus();
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
      const proto = target.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) {
        setter.call(target, text);
      } else {
        target.value = text;
      }
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      target.textContent = text;
      target.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
    }
    return true;
  }

  // Global popover helper
  let activePopover = null;
  function closeGlobalPopover() {
    if (activePopover && activePopover.parentNode) {
      activePopover.parentNode.removeChild(activePopover);
    }
    activePopover = null;
  }

  function showGlobalPopover(anchorEl, items, opts) {
    closeGlobalPopover();
    const rect = anchorEl.getBoundingClientRect();
    const isDark =
      document.documentElement.classList.contains('dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark';
    const minW = (opts && opts.minWidth) || 228;

    const menu = document.createElement('div');
    menu.setAttribute('data-u8-popover', '1');
    menu.style.cssText = [
      'position:fixed',
      'z-index:2147483600',
      `min-width:${minW}px`,
      'padding:4px',
      'border-radius:8px',
      `background:${isDark ? '#1c1c21' : '#ffffff'}`,
      `border:1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
      `box-shadow:${isDark ? '0 10px 28px rgba(0,0,0,0.52)' : '0 8px 24px rgba(0,0,0,0.12)'}`,
      `color:${isDark ? '#f6f6f7' : '#161618'}`,
      "font-family:var(--font-sans,'Inter'),-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif",
    ].join(';');

    items.forEach((it) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = [
        'display:flex',
        'align-items:center',
        'justify-content:space-between',
        'gap:10px',
        'width:100%',
        'padding:7px 10px',
        'border:none',
        'border-radius:6px',
        `background:${it.active ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') : 'transparent'}`,
        'text-align:left',
        `cursor:${it.disabled ? 'default' : 'pointer'}`,
        `color:${it.color || (isDark ? '#f6f6f7' : '#161618')}`,
        `opacity:${it.disabled ? '0.68' : '1'}`,
        'transition:background 0.14s ease',
      ].join(';');

      const leftHtml = `
        <span style="display:flex;flex-direction:column;align-items:flex-start;">
          <span style="display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:500;line-height:1.35;">
            ${
              it.dotColor
                ? `<span style="width:7px;height:7px;border-radius:50%;background:${it.dotColor};flex-shrink:0;"></span>`
                : ''
            }
            <span>${escapeHtml(it.title)}</span>
          </span>
          ${
            it.desc
              ? `<span style="font-size:11.5px;margin-top:2px;color:${
                  isDark ? 'rgba(178,181,183,0.9)' : 'rgba(117,120,122,0.95)'
                };line-height:1.35;">${escapeHtml(it.desc)}</span>`
              : ''
          }
        </span>
      `;
      const checkHtml = it.active
        ? `<span style="font-size:12px;color:#00beb4;font-weight:600;">✓</span>`
        : '';
      btn.innerHTML = leftHtml + checkHtml;

      btn.addEventListener('mouseenter', () => {
        btn.style.background = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.055)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = it.active
          ? isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.05)'
          : 'transparent';
      });
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (typeof it.onClick === 'function') {
          it.onClick();
        }
        if (!it.keepOpen) {
          closeGlobalPopover();
        }
      });
      menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    const menuRect = menu.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + 6;
    if (top + menuRect.height > window.innerHeight - 10) {
      top = Math.max(10, rect.top - menuRect.height - 6);
    }
    if (left + menuRect.width > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - menuRect.width - 10);
    }
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    activePopover = menu;
  }

  document.addEventListener(
    'click',
    (e) => {
      if (activePopover && !activePopover.contains(e.target)) {
        closeGlobalPopover();
      }
    },
    true,
  );

  function init() {
    if (!document.body) return;
    if (document.getElementById('ragflow-u8-weak-guide-host')) return;

    const host = document.createElement('div');
    host.id = 'ragflow-u8-weak-guide-host';
    host.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:40;pointer-events:none;';
    document.body.appendChild(host);

    const modalHost = document.createElement('div');
    modalHost.id = 'ragflow-u8-modal-host';
    // Keep z-index below Radix z-50 drawers/dropdowns so responsive left drawer renders cleanly on top
    modalHost.style.cssText = 'position:fixed;inset:0;z-index:20;pointer-events:none;';
    document.body.appendChild(modalHost);

    const toastHost = document.createElement('div');
    toastHost.id = 'ragflow-u8-toast-host';
    toastHost.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;';
    document.body.appendChild(toastHost);

    const shadow = host.attachShadow({ mode: 'open' });
    const modalShadow = modalHost.attachShadow({ mode: 'open' });

    const commonThemeCSS = `
      :host {
        all: initial;
        font-family: var(--font-sans, 'Inter'), -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
        --u8-accent: rgb(var(--accent-primary, 0 190 180));
        --u8-accent-soft: rgb(var(--accent-primary, 0 190 180) / 0.12);
        --u8-accent-border: rgb(var(--accent-primary, 0 190 180) / 0.34);
        --u8-bg: var(--bg-base, #ffffff);
        --u8-surface: var(--bg-component, #ffffff);
        --u8-surface-solid: #ffffff;
        --u8-surface-subtle: var(--bg-card, rgba(0, 0, 0, 0.04));
        --u8-text: rgb(var(--text-primary, 22 22 24));
        --u8-text-muted: rgb(var(--text-secondary, 117 120 122));
        --u8-border: var(--border-button, rgba(0, 0, 0, 0.1));
        --u8-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
        --u8-warn-bg: rgba(250, 173, 20, 0.12);
        --u8-warn-fg: #b87400;
        --u8-danger-bg: rgba(216, 73, 75, 0.12);
        --u8-danger-fg: #c93b3e;
      }

      .u8-wrap.is-dark, .u8-modal-wrap.is-dark {
        --u8-bg: var(--bg-base, #161618);
        --u8-surface: #1c1c20;
        --u8-surface-solid: #1a1a1e;
        --u8-surface-subtle: rgba(255, 255, 255, 0.055);
        --u8-text: rgb(var(--text-primary, 246 246 247));
        --u8-text-muted: rgb(var(--text-secondary, 178 181 183));
        --u8-border: rgba(255, 255, 255, 0.1);
        --u8-shadow: 0 6px 20px rgba(0, 0, 0, 0.38), 0 1px 4px rgba(0, 0, 0, 0.24);
        --u8-warn-bg: rgba(250, 173, 20, 0.15);
        --u8-warn-fg: #f5b942;
        --u8-danger-bg: rgba(216, 73, 75, 0.18);
        --u8-danger-fg: #f07b7d;
      }

      .is-hidden { display: none !important; }
    `;

    const guideStyle = document.createElement('style');
    guideStyle.textContent =
      commonThemeCSS +
      `
      .u8-wrap { pointer-events: auto; color: var(--u8-text); font-size: 13px; line-height: 1.5; user-select: none; touch-action: none; }
      .u8-pill {
        display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px;
        border-radius: 8px; background: var(--u8-surface); border: 1px solid var(--u8-border);
        box-shadow: var(--u8-shadow); color: var(--u8-text); cursor: grab;
        transition: background 0.16s ease, border-color 0.16s ease;
      }
      .u8-pill:active { cursor: grabbing; }
      .u8-pill:hover { background: var(--u8-surface-subtle); border-color: rgba(150, 150, 160, 0.28); }
      .u8-pill-label { font-size: 13px; font-weight: 500; color: var(--u8-text); }
      .u8-card {
        width: 312px; border-radius: 8px; background: var(--u8-surface);
        border: 1px solid var(--u8-border); box-shadow: var(--u8-shadow); overflow: hidden;
      }
      .u8-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 10px 9px 12px; border-bottom: 1px solid var(--u8-border); cursor: grab; gap: 6px;
      }
      .u8-header:active { cursor: grabbing; }
      .u8-header-left { display: flex; align-items: center; gap: 7px; min-width: 0; }
      .u8-badge {
        font-size: 11px; font-weight: 500; padding: 1px 6px; border-radius: 6px;
        background: var(--u8-surface-subtle); color: var(--u8-text-muted); white-space: nowrap;
      }
      .u8-brand { font-size: 13px; font-weight: 500; color: var(--u8-text); white-space: nowrap; }
      .u8-icon-btn {
        appearance: none; border: none; background: transparent; color: var(--u8-text-muted);
        width: 24px; height: 24px; border-radius: 6px; display: inline-flex;
        align-items: center; justify-content: center; cursor: pointer; font-size: 14px;
      }
      .u8-icon-btn:hover { background: var(--u8-surface-subtle); color: var(--u8-text); }
      .u8-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 8px 12px 2px 12px; }
      .u8-step {
        appearance: none; border: 1px solid transparent; background: var(--u8-surface-subtle);
        color: var(--u8-text-muted); font-size: 10.5px; padding: 4px 2px; border-radius: 6px;
        cursor: pointer; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .u8-step:hover { color: var(--u8-text); border-color: var(--u8-border); }
      .u8-step.is-active { background: var(--u8-surface-subtle); color: var(--u8-text); border-color: var(--u8-border); font-weight: 600; }
      .u8-step.is-locked { opacity: 0.45; cursor: not-allowed; }
      .u8-body { padding: 10px 12px 12px 12px; }
      .u8-readonly-banner {
        margin-bottom: 8px; padding: 5px 8px; border-radius: 6px;
        background: var(--u8-warn-bg); color: var(--u8-warn-fg); font-size: 11.5px; line-height: 1.4;
      }
      .u8-title { font-size: 13px; font-weight: 600; margin: 0 0 6px 0; color: var(--u8-text); }
      .u8-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
      .u8-list li { position: relative; padding-left: 11px; font-size: 12px; color: var(--u8-text-muted); line-height: 1.5; }
      .u8-list li::before {
        content: ''; position: absolute; left: 0; top: 7px; width: 4px; height: 4px;
        border-radius: 50%; background: var(--u8-accent);
      }
      .u8-prompts {
        margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--u8-border);
      }
      .u8-prompts-title { font-size: 11px; color: var(--u8-text-muted); margin-bottom: 6px; }
      .u8-prompts-grid { display: flex; flex-wrap: wrap; gap: 5px; }
      .u8-prompt-chip {
        appearance: none; border: 1px solid var(--u8-border); background: var(--u8-surface-subtle);
        color: var(--u8-text); font-size: 11px; padding: 3px 8px; border-radius: 999px;
        cursor: pointer; transition: border-color 0.15s ease, color 0.15s ease;
      }
      .u8-prompt-chip:hover { border-color: var(--u8-accent-border); color: var(--u8-accent); }
      .u8-footer { display: flex; align-items: center; justify-content: space-between; padding: 0 12px 12px 12px; gap: 8px; }
      .u8-action-btn {
        appearance: none; border: 1px solid var(--u8-border); background: var(--u8-surface-subtle);
        color: var(--u8-text); font-size: 12px; font-weight: 500; padding: 5px 10px; border-radius: 6px; cursor: pointer;
      }
      .u8-action-btn:hover { border-color: var(--u8-accent-border); color: var(--u8-accent); }
      .u8-dismiss {
        appearance: none; border: none; background: transparent; color: var(--u8-text-muted);
        font-size: 11.5px; cursor: pointer; padding: 4px 6px; border-radius: 6px;
      }
      .u8-dismiss:hover { color: var(--u8-text); background: var(--u8-surface-subtle); }
    `;

    const modalStyle = document.createElement('style');
    modalStyle.textContent =
      commonThemeCSS +
      `
      .u8-modal-wrap { color: var(--u8-text); font-size: 13px; line-height: 1.5; }

      /* Subtle top-right readonly pill (always visible even if Weak Guide is collapsed/hidden) */
      .u8-readonly-pill {
        position: fixed; top: 72px; right: 20px; z-index: 30;
        display: inline-flex; align-items: center; gap: 6px;
        padding: 5px 11px; border-radius: 999px;
        background: var(--u8-warn-bg); color: var(--u8-warn-fg);
        border: 1px solid rgba(250, 173, 20, 0.32);
        font-size: 12px; font-weight: 500; pointer-events: auto;
        backdrop-filter: blur(8px);
      }

      /* Full-page No Access fallback (prevents infinite redirect if all modules are blocked) */
      .u8-no-access {
        position: fixed; top: 64px; left: 0; right: 0; bottom: 0;
        background: var(--u8-bg); color: var(--u8-text);
        display: flex; align-items: center; justify-content: center;
        padding: 24px; pointer-events: auto; z-index: 25;
      }
      .u8-no-access-card {
        max-width: 440px; width: 100%; padding: 28px 24px; border-radius: 12px;
        border: 1px solid var(--u8-border); background: var(--u8-surface-solid);
        box-shadow: var(--u8-shadow); text-align: center;
      }
      .u8-no-access-card h3 { margin: 12px 0 8px 0; font-size: 17px; font-weight: 600; }
      .u8-no-access-card p { margin: 0; font-size: 13px; color: var(--u8-text-muted); line-height: 1.6; }

      /* Normal full page below top header */
      .u8-page {
        position: fixed; top: 64px; left: 0; right: 0; bottom: 0;
        background: var(--u8-bg); color: var(--u8-text);
        overflow: auto; pointer-events: auto;
      }
      .u8-page-inner {
        max-width: 1240px; margin: 0 auto; padding: 24px 28px 48px 28px;
        display: flex; flex-direction: column; gap: 14px;
      }
      .u8-page-head {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px; flex-wrap: wrap;
      }
      .u8-page-title {
        font-size: 20px; font-weight: 600; margin: 0;
        display: flex; align-items: center; gap: 10px;
      }
      .u8-head-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .u8-back-btn, .u8-btn-sm {
        appearance: none; height: 32px; padding: 0 12px; border-radius: 7px;
        border: 1px solid var(--u8-border); background: var(--u8-surface-solid);
        color: var(--u8-text); font-size: 12.5px; font-weight: 500;
        cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
        transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
      }
      .u8-back-btn:hover, .u8-btn-sm:hover { border-color: var(--u8-accent-border); color: var(--u8-accent); }
      .u8-btn-sm.is-primary {
        background: var(--u8-accent-soft); border-color: var(--u8-accent-border); color: var(--u8-accent);
      }
      .u8-btn-sm.is-danger { color: var(--u8-danger-fg); }
      .u8-btn-sm.is-danger:hover { border-color: var(--u8-danger-fg); background: var(--u8-danger-bg); }

      .u8-toolbar {
        display: flex; align-items: center; justify-content: space-between;
        flex-wrap: wrap; gap: 10px; padding: 10px 14px;
        border-radius: 10px; background: var(--u8-surface-subtle); border: 1px solid var(--u8-border);
      }
      .u8-toolbar-left, .u8-toolbar-right {
        display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
      }
      .u8-search-input {
        height: 32px; padding: 0 10px; border-radius: 7px;
        border: 1px solid var(--u8-border); background: var(--u8-surface-solid);
        color: var(--u8-text); font-size: 12.5px; outline: none; min-width: 230px;
      }
      .u8-search-input:focus { border-color: var(--u8-accent-border); }

      .u8-dept-bar {
        display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
        padding: 12px 14px; border-radius: 10px;
        background: var(--u8-surface-subtle); border: 1px solid var(--u8-border);
      }
      .u8-chip-group {
        display: inline-flex; align-items: center;
        border: 1px solid var(--u8-border); background: var(--u8-surface-solid);
        border-radius: 7px; overflow: hidden;
      }
      .u8-chip-group.is-active { background: var(--u8-accent-soft); border-color: var(--u8-accent-border); }
      .u8-chip {
        appearance: none; border: none; background: transparent;
        color: var(--u8-text-muted); font-size: 12px; padding: 5px 10px; cursor: pointer;
      }
      .u8-chip-group.is-active .u8-chip { color: var(--u8-accent); font-weight: 600; }
      .u8-chip-edit {
        appearance: none; border: none; border-left: 1px solid var(--u8-border);
        background: transparent; color: var(--u8-text-muted); font-size: 11px; padding: 5px 7px; cursor: pointer;
      }
      .u8-chip-edit:hover { color: var(--u8-accent); background: var(--u8-surface-subtle); }

      .u8-rename-bar {
        display: flex; align-items: center; gap: 8px; width: 100%;
        padding-top: 8px; border-top: 1px dashed var(--u8-border); font-size: 12px; flex-wrap: wrap;
      }
      .u8-input {
        height: 32px; padding: 0 10px; border-radius: 6px;
        border: 1px solid var(--u8-border); background: var(--u8-surface-solid);
        color: var(--u8-text); font-size: 12.5px; outline: none; min-width: 180px; box-sizing: border-box;
      }
      .u8-input:focus { border-color: var(--u8-accent-border); }

      .u8-table-card {
        border-radius: 10px; border: 1px solid var(--u8-border);
        background: var(--u8-surface-solid); overflow: auto; max-height: calc(100vh - 280px);
      }
      table.u8-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
      table.u8-table th, table.u8-table td {
        padding: 10px 12px; border-bottom: 1px solid var(--u8-border);
        text-align: left; vertical-align: middle;
      }
      table.u8-table tr:last-child td { border-bottom: none; }
      table.u8-table th {
        position: sticky; top: 0; z-index: 2;
        background: var(--u8-surface-solid); color: var(--u8-text-muted);
        font-weight: 600; font-size: 12px; user-select: none;
        box-shadow: inset 0 -1px 0 var(--u8-border);
      }
      .u8-th-btn {
        appearance: none; border: none; background: transparent; color: inherit; font: inherit;
        display: inline-flex; align-items: center; gap: 5px; cursor: pointer;
        padding: 2px 4px; border-radius: 5px;
      }
      .u8-th-btn:hover { color: var(--u8-text); background: var(--u8-surface-subtle); }
      .u8-sort-icon { font-size: 11px; opacity: 0.65; }
      .u8-th-btn.is-sorted .u8-sort-icon { opacity: 1; color: var(--u8-accent); }
      .u8-badge {
        font-size: 11px; font-weight: 500; padding: 2px 7px; border-radius: 6px;
        background: var(--u8-accent-soft); color: var(--u8-accent); white-space: nowrap;
      }
      .u8-badge.is-warn { background: var(--u8-warn-bg); color: var(--u8-warn-fg); }
      .u8-member-name { font-weight: 600; color: var(--u8-text); display: flex; align-items: center; gap: 6px; }
      .u8-member-meta { font-size: 11.5px; color: var(--u8-text-muted); margin-top: 2px; }
      .u8-row-actions { display: inline-flex; align-items: center; gap: 6px; }
      .u8-link-btn {
        appearance: none; border: none; background: transparent; color: var(--u8-text-muted);
        font-size: 12px; padding: 3px 6px; border-radius: 5px; cursor: pointer;
      }
      .u8-link-btn:hover { background: var(--u8-surface-subtle); color: var(--u8-accent); }
      .u8-link-btn.is-danger:hover { background: var(--u8-danger-bg); color: var(--u8-danger-fg); }
      .u8-empty-cell { text-align: center !important; padding: 36px 16px !important; color: var(--u8-text-muted); }

      .u8-perm-trigger {
        appearance: none; display: inline-flex; align-items: center; justify-content: space-between;
        gap: 8px; min-width: 74px; height: 28px; padding: 0 9px; border-radius: 6px;
        border: 1px solid var(--u8-border); font-size: 12px; font-weight: 500; cursor: pointer;
        transition: opacity 0.15s ease, border-color 0.15s ease;
      }
      .u8-perm-trigger:hover { opacity: 0.9; }
      .u8-perm-trigger.lv-none { background: var(--u8-danger-bg); color: var(--u8-danger-fg); border-color: transparent; }
      .u8-perm-trigger.lv-read { background: var(--u8-warn-bg); color: var(--u8-warn-fg); border-color: transparent; }
      .u8-perm-trigger.lv-write { background: var(--u8-accent-soft); color: var(--u8-accent); border-color: var(--u8-accent-border); }

      /* Dialog overlay for Member CRUD, Audit Logs, and Help Guide */
      .u8-dialog-backdrop {
        position: fixed; inset: 0; background: rgba(0, 0, 0, 0.48);
        display: flex; align-items: center; justify-content: center;
        padding: 20px; z-index: 60; pointer-events: auto;
      }
      .u8-dialog {
        width: 100%; max-width: 480px; max-height: 82vh; overflow: auto;
        border-radius: 12px; background: var(--u8-surface-solid);
        border: 1px solid var(--u8-border); box-shadow: var(--u8-shadow);
        padding: 20px 22px; display: flex; flex-direction: column; gap: 14px;
      }
      .u8-dialog.is-wide { max-width: 780px; }
      .u8-dialog-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .u8-dialog-title { margin: 0; font-size: 16px; font-weight: 600; }
      .u8-form-row { display: flex; flex-direction: column; gap: 5px; }
      .u8-form-row label { font-size: 12px; font-weight: 500; color: var(--u8-text-muted); }
      .u8-form-row .u8-input { width: 100%; }
      .u8-checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 12.5px; cursor: pointer; }
      .u8-dialog-foot { display: flex; justify-content: flex-end; gap: 8px; padding-top: 6px; }
      .u8-help-sec h4 { margin: 10px 0 6px 0; font-size: 13.5px; font-weight: 600; color: var(--u8-text); }
      .u8-help-sec ul { margin: 0; padding-left: 18px; color: var(--u8-text-muted); font-size: 12.5px; display: flex; flex-direction: column; gap: 5px; }
    `;

    const GUIDE_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.88;"><circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" stroke="#00beb4" fill="rgba(0,190,180,0.18)"/></svg>`;
    const SHIELD_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4" stroke="#00beb4" stroke-width="2"/></svg>`;
    const LOCK_ICON_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.75;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

    const wrap = document.createElement('div');
    wrap.className = 'u8-wrap';
    wrap.innerHTML = `
      <button class="u8-pill is-hidden" type="button" data-role="pill-open">
        ${GUIDE_ICON_SVG}
        <span class="u8-pill-label" data-role="pill-label"></span>
      </button>
      <div class="u8-card" role="complementary">
        <div class="u8-header">
          <div class="u8-header-left">
            ${GUIDE_ICON_SVG}
            <span class="u8-brand" data-role="brand-label"></span>
            <span class="u8-badge" data-role="tag"></span>
          </div>
          <button class="u8-icon-btn" type="button" data-role="collapse">–</button>
        </div>
        <div class="u8-steps" data-role="steps"></div>
        <div class="u8-body">
          <div class="u8-readonly-banner is-hidden" data-role="readonly-banner"></div>
          <h4 class="u8-title" data-role="title"></h4>
          <ul class="u8-list" data-role="tips"></ul>
          <div class="u8-prompts is-hidden" data-role="prompts-box">
            <div class="u8-prompts-title" data-role="prompts-title"></div>
            <div class="u8-prompts-grid" data-role="prompts-grid"></div>
          </div>
        </div>
        <div class="u8-footer">
          <button class="u8-action-btn" type="button" data-role="action"></button>
          <button class="u8-dismiss" type="button" data-role="minimize"></button>
        </div>
      </div>
    `;

    const modalWrap = document.createElement('div');
    modalWrap.className = 'u8-modal-wrap';
    modalWrap.innerHTML = `
      <div class="u8-readonly-pill is-hidden" data-role="readonly-top-pill"></div>
      <div class="u8-no-access is-hidden" data-role="no-access-page">
        <div class="u8-no-access-card">
          <div>${SHIELD_ICON_SVG}</div>
          <h3 data-role="no-access-title"></h3>
          <p data-role="no-access-desc"></p>
        </div>
      </div>
      <div class="u8-page is-hidden" data-role="perm-page" role="main">
        <div class="u8-page-inner">
          <div class="u8-page-head">
            <h2 class="u8-page-title">${SHIELD_ICON_SVG}<span data-role="perm-page-title"></span></h2>
            <div class="u8-head-actions">
              <button class="u8-btn-sm is-primary" type="button" data-role="btn-add-member"></button>
              <button class="u8-btn-sm" type="button" data-role="btn-audit-log"></button>
              <button class="u8-btn-sm" type="button" data-role="btn-export-csv"></button>
              <button class="u8-back-btn" type="button" data-role="close-page"></button>
            </div>
          </div>
          <div class="u8-dept-bar" data-role="dept-bar"></div>
          <div class="u8-toolbar">
            <div class="u8-toolbar-left">
              <input class="u8-search-input" type="search" data-role="perm-search" />
            </div>
            <div class="u8-toolbar-right" data-role="batch-bar"></div>
          </div>
          <div class="u8-table-card">
            <table class="u8-table">
              <thead data-role="policy-thead"></thead>
              <tbody data-role="policy-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="u8-dialog-backdrop is-hidden" data-role="sub-dialog-backdrop">
        <div class="u8-dialog" data-role="sub-dialog"></div>
      </div>
    `;

    shadow.appendChild(guideStyle);
    shadow.appendChild(wrap);
    modalShadow.appendChild(modalStyle);
    modalShadow.appendChild(modalWrap);

    const pillOpen = shadow.querySelector('[data-role="pill-open"]');
    const pillLabel = shadow.querySelector('[data-role="pill-label"]');
    const brandLabel = shadow.querySelector('[data-role="brand-label"]');
    const card = shadow.querySelector('.u8-card');
    const header = shadow.querySelector('.u8-header');
    const tagEl = shadow.querySelector('[data-role="tag"]');
    const stepsEl = shadow.querySelector('[data-role="steps"]');
    const readonlyBanner = shadow.querySelector('[data-role="readonly-banner"]');
    const titleEl = shadow.querySelector('[data-role="title"]');
    const tipsEl = shadow.querySelector('[data-role="tips"]');
    const promptsBox = shadow.querySelector('[data-role="prompts-box"]');
    const promptsTitle = shadow.querySelector('[data-role="prompts-title"]');
    const promptsGrid = shadow.querySelector('[data-role="prompts-grid"]');
    const actionBtn = shadow.querySelector('[data-role="action"]');
    const collapseBtn = shadow.querySelector('[data-role="collapse"]');
    const minimizeBtn = shadow.querySelector('[data-role="minimize"]');

    const readonlyTopPill = modalShadow.querySelector('[data-role="readonly-top-pill"]');
    const noAccessPage = modalShadow.querySelector('[data-role="no-access-page"]');
    const noAccessTitle = modalShadow.querySelector('[data-role="no-access-title"]');
    const noAccessDesc = modalShadow.querySelector('[data-role="no-access-desc"]');
    const permPage = modalShadow.querySelector('[data-role="perm-page"]');
    const permPageTitleEl = modalShadow.querySelector('[data-role="perm-page-title"]');
    const btnAddMember = modalShadow.querySelector('[data-role="btn-add-member"]');
    const btnAuditLog = modalShadow.querySelector('[data-role="btn-audit-log"]');
    const btnExportCsv = modalShadow.querySelector('[data-role="btn-export-csv"]');
    const closePageBtn = modalShadow.querySelector('[data-role="close-page"]');
    const permSearchInput = modalShadow.querySelector('[data-role="perm-search"]');
    const deptBarEl = modalShadow.querySelector('[data-role="dept-bar"]');
    const batchBarEl = modalShadow.querySelector('[data-role="batch-bar"]');
    const policyThead = modalShadow.querySelector('[data-role="policy-thead"]');
    const policyTbody = modalShadow.querySelector('[data-role="policy-tbody"]');
    const subDialogBackdrop = modalShadow.querySelector('[data-role="sub-dialog-backdrop"]');
    const subDialog = modalShadow.querySelector('[data-role="sub-dialog"]');

    let currentActionRoute = null;
    let meState = null;
    let lastToken = '';
    let allPolicies = [];
    let deptNames = {};
    let selectedDept = '__ALL__';
    let searchKeyword = '';
    let renamingDept = null;
    let batchMod = '__ALL_MODS__';
    let batchLevel = 'read';
    let sortKey = 'member';
    let sortDir = 'asc';
    let permPageOpen = false;
    let permLoading = false;
    let toastTimer = null;

    function showToast(msg) {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark';
      toastHost.innerHTML = `<div style="padding:8px 16px;border-radius:8px;background:${
        isDark ? '#1c1c21' : '#ffffff'
      };border:1px solid ${
        isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
      };box-shadow:0 6px 20px rgba(0,0,0,0.28);color:${
        isDark ? '#f6f6f7' : '#161618'
      };font-size:12.5px;font-family:var(--font-sans,'Inter'),sans-serif;white-space:nowrap;">${escapeHtml(msg)}</div>`;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toastHost.innerHTML = '';
      }, 2800);
    }

    function deptDisplayName(code) {
      if (!code) return '-';
      return deptNames[code] ? deptNames[code] : t('permDeptPrefix', { code });
    }

    function applyGuideVisibility() {
      host.style.display = isGuideVisible() ? '' : 'none';
    }

    function clampHostPosition() {
      const curR = parseFloat(host.style.right) || 20;
      const curB = parseFloat(host.style.bottom) || 20;
      const maxR = Math.max(12, window.innerWidth - 120);
      const maxB = Math.max(12, window.innerHeight - 60);
      host.style.right = Math.min(Math.max(12, curR), maxR) + 'px';
      host.style.bottom = Math.min(Math.max(12, curB), maxB) + 'px';
    }

    function syncTheme() {
      const html = document.documentElement;
      const body = document.body;
      const isDark =
        html.classList.contains('dark') ||
        (body && body.classList.contains('dark')) ||
        html.getAttribute('data-theme') === 'dark';
      wrap.classList.toggle('is-dark', isDark);
      modalWrap.classList.toggle('is-dark', isDark);
    }

    function setCollapsed(collapsed) {
      try {
        localStorage.setItem(STORAGE_COLLAPSED, collapsed ? '1' : '0');
      } catch (_) {}
      pillOpen.classList.toggle('is-hidden', !collapsed);
      card.classList.toggle('is-hidden', collapsed);
    }

    function closeSubDialog() {
      subDialogBackdrop.classList.add('is-hidden');
      subDialog.classList.remove('is-wide');
      subDialog.innerHTML = '';
    }

    subDialogBackdrop.addEventListener('click', (e) => {
      if (e.target === subDialogBackdrop) closeSubDialog();
    });

    function syncNavActiveStates() {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark';

      document.querySelectorAll('nav').forEach((nav) => {
        const permBtn = nav.querySelector('button[data-u8-nav-perm="1"]');
        if (!permBtn) return;
        const isHorizontal = permBtn.dataset.u8NavMode === 'horizontal';

        const inactiveColor = isDark ? 'rgba(246,246,247,0.75)' : 'rgba(22,22,24,0.75)';
        const sibNodes = nav.querySelectorAll('li:not([data-u8-nav-perm-li="1"]), a, button:not([data-u8-nav-perm="1"])');
        sibNodes.forEach((sib) => {
          if (sib.closest('[data-u8-nav-perm-li="1"]') || sib.closest('[data-u8-nav-perm="1"]')) return;
          if (permPageOpen) {
            if (!sib.dataset.u8SuppressedActive) sib.dataset.u8SuppressedActive = '1';
            if (isHorizontal) {
              sib.style.setProperty('background', 'transparent', 'important');
              sib.style.setProperty('background-color', 'transparent', 'important');
              sib.style.setProperty('box-shadow', 'none', 'important');
              sib.style.setProperty('border-color', 'transparent', 'important');
              sib.style.setProperty('color', inactiveColor, 'important');
              sib.querySelectorAll('span, div, svg').forEach((child) => {
                if (!child.dataset.u8SuppressedChild) child.dataset.u8SuppressedChild = '1';
                child.style.setProperty('background', 'transparent', 'important');
                child.style.setProperty('background-color', 'transparent', 'important');
                child.style.setProperty('box-shadow', 'none', 'important');
                child.style.setProperty('color', inactiveColor, 'important');
              });
            } else {
              sib.style.setProperty('background', 'transparent', 'important');
              sib.style.setProperty('background-color', 'transparent', 'important');
              sib.style.setProperty('border-left-color', 'transparent', 'important');
            }
          } else if (sib.dataset.u8SuppressedActive) {
            sib.style.removeProperty('background');
            sib.style.removeProperty('background-color');
            sib.style.removeProperty('box-shadow');
            sib.style.removeProperty('border-color');
            sib.style.removeProperty('color');
            sib.style.removeProperty('border-left-color');
            sib.querySelectorAll('[data-u8-suppressed-child="1"]').forEach((child) => {
              child.style.removeProperty('background');
              child.style.removeProperty('background-color');
              child.style.removeProperty('box-shadow');
              child.style.removeProperty('color');
              delete child.dataset.u8SuppressedChild;
            });
            delete sib.dataset.u8SuppressedActive;
          }
        });

        if (isHorizontal) {
          if (permPageOpen) {
            permBtn.style.setProperty('background', isDark ? '#f6f6f7' : '#161618', 'important');
            permBtn.style.setProperty('color', isDark ? '#161618' : '#ffffff', 'important');
            permBtn.style.setProperty('box-shadow', '0 2px 6px rgba(0, 190, 180, 0.55)', 'important');
            permBtn.style.setProperty('border-radius', '9999px', 'important');
            permBtn.style.setProperty('font-weight', '500', 'important');
          } else {
            permBtn.style.setProperty('background', 'transparent', 'important');
            permBtn.style.setProperty('color', isDark ? 'rgba(246,246,247,0.75)' : 'rgba(22,22,24,0.75)', 'important');
            permBtn.style.setProperty('box-shadow', 'none', 'important');
            permBtn.style.setProperty('border-radius', '9999px', 'important');
            permBtn.style.removeProperty('font-weight');
          }
        } else {
          if (permPageOpen) {
            permBtn.style.setProperty('background', isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', 'important');
            permBtn.style.setProperty('color', isDark ? '#ffffff' : '#161618', 'important');
            permBtn.style.setProperty('border-left', isDark ? '2px solid #ffffff' : '2px solid #161618', 'important');
          } else {
            permBtn.style.setProperty('background', 'transparent', 'important');
            permBtn.style.removeProperty('color');
            permBtn.style.setProperty('border-left', '2px solid transparent', 'important');
          }
        }
      });
    }

    function closePermissionPage() {
      permPageOpen = false;
      renamingDept = null;
      permPage.classList.add('is-hidden');
      closeSubDialog();
      closeGlobalPopover();
      syncNavActiveStates();
    }

    function positionOverlayBelowHeader() {
      const hdr = document.querySelector('header');
      const topOffset = hdr ? Math.max(48, Math.round(hdr.getBoundingClientRect().height)) : 64;
      permPage.style.top = topOffset + 'px';
      noAccessPage.style.top = topOffset + 'px';
      readonlyTopPill.style.top = topOffset + 10 + 'px';
    }

    function findFirstAllowedRoute() {
      if (!meState || meState.is_owner) return '/chats';
      const perms = meState.permissions || {};
      for (const m of MOD_META) {
        if (perms[m.key] && perms[m.key] !== 'none') {
          return m.route;
        }
      }
      return null;
    }

    function renderNoAccessOverlay(show) {
      if (show) {
        positionOverlayBelowHeader();
        noAccessTitle.textContent = t('noAccessTitle');
        noAccessDesc.textContent = t('noAccessDesc');
        noAccessPage.classList.remove('is-hidden');
      } else {
        noAccessPage.classList.add('is-hidden');
      }
    }

    function enforceMemberRouteGuard() {
      if (!meState || meState.is_owner) {
        renderNoAccessOverlay(false);
        return;
      }
      const p = (window.location.pathname || '/').toLowerCase();
      if (p.startsWith('/login')) {
        renderNoAccessOverlay(false);
        return;
      }
      const firstAllowed = findFirstAllowedRoute();
      if (!firstAllowed) {
        renderNoAccessOverlay(true);
        return;
      }
      renderNoAccessOverlay(false);
      const mod = routeToModule(window.location.pathname);
      if (!mod) return;
      const lv = (meState.permissions && meState.permissions[mod]) || 'none';
      if (lv === 'none') {
        showToast(t('redirectedToast', { mod: getModLabel(mod) }));
        navigateTo(firstAllowed);
      }
    }

    function renderReadonlyBar() {
      const mod = routeToModule(window.location.pathname);
      const isReadonly =
        Boolean(meState && !meState.is_owner && mod && meState.permissions && meState.permissions[mod] === 'read') &&
        !permPageOpen;
      if (isReadonly) {
        positionOverlayBelowHeader();
        readonlyTopPill.innerHTML = `${LOCK_ICON_SVG}<span>${escapeHtml(t('readonlyTopPill', { mod: getModLabel(mod) }))}</span>`;
        readonlyTopPill.classList.remove('is-hidden');
      } else {
        readonlyTopPill.classList.add('is-hidden');
      }
    }

    function renderRoute() {
      enforceMemberRouteGuard();
      renderReadonlyBar();
      const guide = getRouteGuide(window.location.pathname);
      pillLabel.textContent = t('pillLabel');
      pillOpen.title = t('expandTitle');
      brandLabel.textContent = t('brandLabel');
      header.title = t('dragTitle');
      collapseBtn.title = t('collapseTitle');
      minimizeBtn.textContent = t('minimize');
      tagEl.textContent = guide.tag;
      titleEl.textContent = guide.title;

      const mod = routeToModule(window.location.pathname);
      if (meState && !meState.is_owner && mod && meState.permissions && meState.permissions[mod] === 'read') {
        readonlyBanner.textContent = t('readonlyBanner', { mod: getModLabel(mod) });
        readonlyBanner.classList.remove('is-hidden');
      } else {
        readonlyBanner.classList.add('is-hidden');
      }

      tipsEl.innerHTML = '';
      guide.tips.forEach((tip) => {
        const li = document.createElement('li');
        li.textContent = tip;
        tipsEl.appendChild(li);
      });

      // U8 Quick Prompts on /chats
      if (guide.showQuickPrompts) {
        const lang = getCurrentLang();
        const prompts = U8_QUICK_PROMPTS[lang] || U8_QUICK_PROMPTS.zh;
        promptsTitle.textContent = t('quickPromptsTitle');
        promptsGrid.innerHTML = '';
        prompts.forEach((pr) => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'u8-prompt-chip';
          chip.textContent = pr.label;
          chip.title = pr.text;
          chip.addEventListener('click', () => {
            if (fillChatInput(pr.text)) {
              showToast(t('quickPromptFilled'));
            } else {
              showToast(t('quickPromptNoInput'));
            }
          });
          promptsGrid.appendChild(chip);
        });
        promptsBox.classList.remove('is-hidden');
      } else {
        promptsBox.classList.add('is-hidden');
      }

      stepsEl.innerHTML = '';
      STEPS.forEach((s) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const locked =
          meState && !meState.is_owner && meState.permissions && meState.permissions[s.mod] === 'none';
        btn.className =
          'u8-step' +
          (s.key === guide.step ? ' is-active' : '') +
          (locked ? ' is-locked' : '');
        btn.textContent = t(s.labelKey);
        btn.title = btn.textContent;
        btn.addEventListener('click', () => {
          if (locked) {
            showToast(t('lockedModuleToast', { mod: getModLabel(s.mod) }));
            return;
          }
          closePermissionPage();
          navigateTo(s.route);
        });
        stepsEl.appendChild(btn);
      });

      if (guide.action) {
        currentActionRoute = guide.action.route;
        actionBtn.textContent = guide.action.label;
        actionBtn.classList.remove('is-hidden');
      } else {
        currentActionRoute = null;
        actionBtn.classList.add('is-hidden');
      }
    }

    async function refreshMe() {
      const token = getAuthToken();
      if (!token) {
        meState = null;
        closePermissionPage();
        enhancePageDOM();
        renderRoute();
        return;
      }
      try {
        const { status, data } = await rbacFetch('/me');
        if (status === 200 && data && data.code === 0) {
          meState = data.data;
          enhancePageDOM();
          renderRoute();
        }
      } catch (_) {}
    }

    function openHelpModal() {
      subDialog.classList.remove('is-wide');
      const sec1 = I18N_RESOURCES[getCurrentLang()]?.helpSec1Items || I18N_RESOURCES.zh.helpSec1Items;
      const sec2 = I18N_RESOURCES[getCurrentLang()]?.helpSec2Items || I18N_RESOURCES.zh.helpSec2Items;
      const sec3 = I18N_RESOURCES[getCurrentLang()]?.helpSec3Items || I18N_RESOURCES.zh.helpSec3Items;
      subDialog.innerHTML = `
        <div class="u8-dialog-head">
          <div>
            <h3 class="u8-dialog-title">${escapeHtml(t('helpTitle'))}</h3>
            <div style="font-size:12px;color:var(--u8-text-muted);margin-top:2px;">${escapeHtml(t('helpSubtitle'))}</div>
          </div>
          <button class="u8-btn-sm" type="button" data-role="dlg-close">${escapeHtml(t('btnClose'))}</button>
        </div>
        <div class="u8-help-sec">
          <h4>${escapeHtml(t('helpSec1Title'))}</h4>
          <ul>${sec1.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
          <h4>${escapeHtml(t('helpSec2Title'))}</h4>
          <ul>${sec2.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
          <h4>${escapeHtml(t('helpSec3Title'))}</h4>
          <ul>${sec3.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
        </div>
      `;
      subDialog.querySelector('[data-role="dlg-close"]').addEventListener('click', closeSubDialog);
      subDialogBackdrop.classList.remove('is-hidden');
    }

    function openMemberModal(existingItem) {
      const isEdit = Boolean(existingItem);
      const canToggleAdmin = Boolean(meState && meState.is_primary_owner && (!isEdit || !existingItem.is_owner));
      subDialog.classList.remove('is-wide');
      subDialog.innerHTML = `
        <div class="u8-dialog-head">
          <h3 class="u8-dialog-title">${escapeHtml(isEdit ? t('memberModalEditTitle') : t('memberModalAddTitle'))}</h3>
          <button class="u8-btn-sm" type="button" data-role="dlg-close">${escapeHtml(t('btnClose'))}</button>
        </div>
        <div class="u8-form-row">
          <label>${escapeHtml(t('fieldEmail'))}</label>
          <input class="u8-input" type="email" data-field="email" placeholder="name@u8.local" value="${escapeHtml(isEdit ? existingItem.email : '')}" ${isEdit ? 'disabled' : ''} />
        </div>
        <div class="u8-form-row">
          <label>${escapeHtml(t('fieldName'))}</label>
          <input class="u8-input" type="text" data-field="name" value="${escapeHtml(isEdit ? existingItem.name : '')}" />
        </div>
        <div class="u8-form-row">
          <label>${escapeHtml(t('fieldEmpNo'))}</label>
          <input class="u8-input" type="text" data-field="emp_no" value="${escapeHtml(isEdit ? existingItem.emp_no : '')}" />
        </div>
        <div class="u8-form-row">
          <label>${escapeHtml(t('fieldDept'))}</label>
          <input class="u8-input" type="text" data-field="dept" placeholder="01 / 02 / 其他" value="${escapeHtml(isEdit ? existingItem.dept : selectedDept !== '__ALL__' ? selectedDept : '')}" />
        </div>
        ${
          canToggleAdmin
            ? `<label class="u8-checkbox-row"><input type="checkbox" data-field="is_admin" ${existingItem && existingItem.is_admin ? 'checked' : ''} /><span>${escapeHtml(t('fieldIsAdmin'))}</span></label>`
            : ''
        }
        <div class="u8-dialog-foot">
          <button class="u8-btn-sm" type="button" data-role="dlg-cancel">${escapeHtml(t('permCancel'))}</button>
          <button class="u8-btn-sm is-primary" type="button" data-role="dlg-save">${escapeHtml(t('btnSave'))}</button>
        </div>
      `;
      subDialog.querySelector('[data-role="dlg-close"]').addEventListener('click', closeSubDialog);
      subDialog.querySelector('[data-role="dlg-cancel"]').addEventListener('click', closeSubDialog);
      subDialog.querySelector('[data-role="dlg-save"]').addEventListener('click', async () => {
        const email = (subDialog.querySelector('[data-field="email"]').value || '').trim().toLowerCase();
        const name = (subDialog.querySelector('[data-field="name"]').value || '').trim();
        const emp_no = (subDialog.querySelector('[data-field="emp_no"]').value || '').trim();
        const dept = (subDialog.querySelector('[data-field="dept"]').value || '').trim() || '其他';
        const adminCb = subDialog.querySelector('[data-field="is_admin"]');
        const payload = { email, name, emp_no, dept };
        if (adminCb) payload.is_admin = adminCb.checked;

        const { status, data } = await rbacFetch('/policies/user', {
          method: isEdit ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        });
        if (status === 200 && data && data.code === 0) {
          showToast(isEdit ? t('permMemberUpdated', { name: name || email }) : t('permMemberAdded', { name: name || email }));
          closeSubDialog();
          await reloadPolicies();
        } else {
          showToast(t('permOpFailed', { msg: (data && data.message) || status }));
        }
      });
      subDialogBackdrop.classList.remove('is-hidden');
    }

    async function openAuditLogModal() {
      subDialog.classList.add('is-wide');
      subDialog.innerHTML = `
        <div class="u8-dialog-head">
          <h3 class="u8-dialog-title">${escapeHtml(t('auditTitle'))}</h3>
          <button class="u8-btn-sm" type="button" data-role="dlg-close">${escapeHtml(t('btnClose'))}</button>
        </div>
        <div style="color:var(--u8-text-muted);font-size:12.5px;">${escapeHtml(t('permLoading'))}</div>
      `;
      subDialog.querySelector('[data-role="dlg-close"]').addEventListener('click', closeSubDialog);
      subDialogBackdrop.classList.remove('is-hidden');

      const { status, data } = await rbacFetch('/audit-logs?limit=100');
      const logs = status === 200 && data && data.code === 0 ? data.data || [] : [];
      const rowsHtml = logs.length
        ? logs
            .map((l) => {
              const dt = l.created_at ? new Date(l.created_at * 1000).toLocaleString() : '-';
              return `<tr>
                <td style="white-space:nowrap;">${escapeHtml(dt)}</td>
                <td>${escapeHtml(l.actor_name || l.actor_email)}</td>
                <td><span class="u8-badge">${escapeHtml(l.action)}</span></td>
                <td>${escapeHtml(l.target)}</td>
                <td style="max-width:260px;word-break:break-all;font-size:11.5px;color:var(--u8-text-muted);">${escapeHtml(l.detail)}</td>
              </tr>`;
            })
            .join('')
        : `<tr><td colspan="5" class="u8-empty-cell">${escapeHtml(t('auditEmpty'))}</td></tr>`;

      subDialog.innerHTML = `
        <div class="u8-dialog-head">
          <h3 class="u8-dialog-title">${escapeHtml(t('auditTitle'))}</h3>
          <button class="u8-btn-sm" type="button" data-role="dlg-close">${escapeHtml(t('btnClose'))}</button>
        </div>
        <div class="u8-table-card" style="max-height:58vh;">
          <table class="u8-table">
            <thead>
              <tr>
                <th>${escapeHtml(t('auditTime'))}</th>
                <th>${escapeHtml(t('auditActor'))}</th>
                <th>${escapeHtml(t('auditAction'))}</th>
                <th>${escapeHtml(t('auditTarget'))}</th>
                <th>${escapeHtml(t('auditDetail'))}</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      `;
      subDialog.querySelector('[data-role="dlg-close"]').addEventListener('click', closeSubDialog);
    }

    async function exportPoliciesCsv() {
      try {
        const token = getAuthToken();
        const resp = await fetch('/u8-rbac-api/policies/export?format=csv', {
          headers: token ? { Authorization: token } : {},
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `u8_rbac_policies_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast(t('permExportDone'));
      } catch (_) {
        showToast(t('permExportFail'));
      }
    }

    function renderPermissionPage() {
      permPageTitleEl.textContent = t('permPageTitle');
      btnAddMember.textContent = t('permAddMember');
      btnAuditLog.textContent = t('permAuditLog');
      btnExportCsv.textContent = t('permExportCsv');
      closePageBtn.textContent = t('permBackBtn');
      permSearchInput.placeholder = t('permSearchPlaceholder');
      if (permSearchInput.value !== searchKeyword) {
        permSearchInput.value = searchKeyword;
      }

      const depts = Array.from(new Set(allPolicies.map((p) => p.dept).filter(Boolean))).sort();

      // Department filter chips with custom rename support
      deptBarEl.innerHTML = '';

      const allGroup = document.createElement('div');
      allGroup.className = 'u8-chip-group' + (selectedDept === '__ALL__' ? ' is-active' : '');
      const allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.className = 'u8-chip';
      allBtn.textContent = `${t('permAllDepts')} (${allPolicies.length})`;
      allBtn.addEventListener('click', () => {
        selectedDept = '__ALL__';
        renderPermissionPage();
      });
      allGroup.appendChild(allBtn);
      deptBarEl.appendChild(allGroup);

      depts.forEach((d) => {
        const cnt = allPolicies.filter((p) => p.dept === d).length;
        const grp = document.createElement('div');
        grp.className = 'u8-chip-group' + (selectedDept === d ? ' is-active' : '');

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'u8-chip';
        btn.textContent = `${deptDisplayName(d)} (${cnt})`;
        btn.addEventListener('click', () => {
          selectedDept = d;
          renderPermissionPage();
        });

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'u8-chip-edit';
        editBtn.title = t('permRenameTip', { code: d });
        editBtn.textContent = '✎';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          renamingDept = d;
          renderPermissionPage();
        });

        grp.appendChild(btn);
        grp.appendChild(editBtn);
        deptBarEl.appendChild(grp);
      });

      if (renamingDept) {
        const bar = document.createElement('div');
        bar.className = 'u8-rename-bar';
        bar.innerHTML = `<span>${escapeHtml(t('permRenameLabel', { code: renamingDept }))}</span>`;
        const input = document.createElement('input');
        input.className = 'u8-input';
        input.type = 'text';
        input.placeholder = t('permRenamePlaceholder', { code: renamingDept });
        input.value = deptNames[renamingDept] || '';

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'u8-btn-sm is-primary';
        saveBtn.textContent = t('permSaveName');
        const doSave = async () => {
          const code = renamingDept;
          const val = input.value.trim();
          const { status, data } = await rbacFetch('/dept-names', {
            method: 'PUT',
            body: JSON.stringify({ dept_code: code, dept_name: val }),
          });
          if (status === 200 && data && data.code === 0) {
            deptNames = data.dept_names || {};
            renamingDept = null;
            showToast(t('permDeptSaved', { code }));
            renderPermissionPage();
          } else {
            showToast(t('permDeptSaveFail'));
          }
        };
        saveBtn.addEventListener('click', doSave);
        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') doSave();
          if (ev.key === 'Escape') {
            renamingDept = null;
            renderPermissionPage();
          }
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'u8-btn-sm';
        cancelBtn.textContent = t('permCancel');
        cancelBtn.addEventListener('click', () => {
          renamingDept = null;
          renderPermissionPage();
        });

        bar.appendChild(input);
        bar.appendChild(saveBtn);
        bar.appendChild(cancelBtn);
        deptBarEl.appendChild(bar);
        setTimeout(() => input.focus(), 10);
      }

      // Batch update toolbar for currently selected department (or all)
      const scopeLabel = selectedDept === '__ALL__' ? t('permAllDepts') : deptDisplayName(selectedDept);
      batchBarEl.innerHTML = '';
      const batchLbl = document.createElement('span');
      batchLbl.style.cssText = 'font-size:12px;color:var(--u8-text-muted);';
      batchLbl.textContent = t('permBatchLabel', { scope: scopeLabel });

      const modTrig = document.createElement('button');
      modTrig.type = 'button';
      modTrig.className = 'u8-btn-sm';
      modTrig.textContent = (batchMod === '__ALL_MODS__' ? t('permBatchAllMods') : getModLabel(batchMod)) + ' ▾';
      modTrig.addEventListener('click', (e) => {
        e.stopPropagation();
        const opts = [{ title: t('permBatchAllMods'), active: batchMod === '__ALL_MODS__', onClick: () => { batchMod = '__ALL_MODS__'; renderPermissionPage(); } }].concat(
          MOD_META.map((m) => ({
            title: t(m.labelKey),
            active: batchMod === m.key,
            onClick: () => {
              batchMod = m.key;
              renderPermissionPage();
            },
          })),
        );
        showGlobalPopover(modTrig, opts, { minWidth: 136 });
      });

      const lvTrig = document.createElement('button');
      lvTrig.type = 'button';
      lvTrig.className = `u8-perm-trigger lv-${batchLevel}`;
      lvTrig.innerHTML = `<span>${escapeHtml(getLevelLabel(batchLevel))}</span><span style="font-size:10px;opacity:0.75;">▾</span>`;
      lvTrig.addEventListener('click', (e) => {
        e.stopPropagation();
        showGlobalPopover(
          lvTrig,
          [
            { title: t('lvWrite'), dotColor: '#00beb4', active: batchLevel === 'write', onClick: () => { batchLevel = 'write'; renderPermissionPage(); } },
            { title: t('lvRead'), dotColor: '#f5b942', active: batchLevel === 'read', onClick: () => { batchLevel = 'read'; renderPermissionPage(); } },
            { title: t('lvNone'), dotColor: '#f07b7d', active: batchLevel === 'none', onClick: () => { batchLevel = 'none'; renderPermissionPage(); } },
          ],
          { minWidth: 112 },
        );
      });

      const applyBatchBtn = document.createElement('button');
      applyBatchBtn.type = 'button';
      applyBatchBtn.className = 'u8-btn-sm is-primary';
      applyBatchBtn.textContent = t('permBatchApply');
      applyBatchBtn.addEventListener('click', async () => {
        const perms = {};
        const partial = batchMod !== '__ALL_MODS__';
        if (partial) {
          perms[batchMod] = batchLevel;
        } else {
          MOD_META.forEach((m) => {
            perms[m.key] = batchLevel;
          });
        }
        const { status, data } = await rbacFetch('/policies/dept', {
          method: 'PUT',
          body: JSON.stringify({ dept: selectedDept, permissions: perms, partial }),
        });
        if (status === 200 && data && data.code === 0) {
          showToast(t('permBatchDone', { count: data.affected || 0 }));
          await reloadPolicies();
        } else {
          showToast(t('permBatchFail'));
        }
      });

      batchBarEl.appendChild(batchLbl);
      batchBarEl.appendChild(modTrig);
      batchBarEl.appendChild(lvTrig);
      batchBarEl.appendChild(applyBatchBtn);

      // Sortable Table Headers
      const cols = [{ key: 'member', label: t('permColMember') }].concat(
        MOD_META.map((m) => ({ key: m.key, label: t(m.labelKey) })),
      );
      policyThead.innerHTML = '';
      const headTr = document.createElement('tr');
      cols.forEach((col) => {
        const thEl = document.createElement('th');
        const active = sortKey === col.key;
        const icon = active ? (sortDir === 'asc' ? '↑' : '↓') : '↕';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'u8-th-btn' + (active ? ' is-sorted' : '');
        btn.innerHTML = `<span>${escapeHtml(col.label)}</span><span class="u8-sort-icon">${icon}</span>`;
        btn.addEventListener('click', () => {
          if (sortKey === col.key) {
            sortDir = sortDir === 'asc' ? 'desc' : 'asc';
          } else {
            sortKey = col.key;
            sortDir = col.key === 'member' ? 'asc' : 'desc';
          }
          renderPermissionPage();
        });
        thEl.appendChild(btn);
        headTr.appendChild(thEl);
      });
      const actTh = document.createElement('th');
      actTh.textContent = t('permColAction');
      headTr.appendChild(actTh);
      policyThead.appendChild(headTr);

      policyTbody.innerHTML = '';
      if (permLoading) {
        policyTbody.innerHTML = `<tr><td colspan="${cols.length + 1}" class="u8-empty-cell">${escapeHtml(t('permLoading'))}</td></tr>`;
        return;
      }

      // Filter by department + search keyword
      const kw = searchKeyword.trim().toLowerCase();
      const filtered = allPolicies.filter((p) => {
        if (selectedDept !== '__ALL__' && p.dept !== selectedDept) return false;
        if (!kw) return true;
        const dn = (deptNames[p.dept] || '').toLowerCase();
        return (
          (p.name || '').toLowerCase().includes(kw) ||
          (p.emp_no || '').toLowerCase().includes(kw) ||
          (p.email || '').toLowerCase().includes(kw) ||
          (p.dept || '').toLowerCase().includes(kw) ||
          dn.includes(kw)
        );
      });

      filtered.sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'member') {
          const ka = `${a.dept || ''}-${a.emp_no || ''}-${a.name || ''}`;
          const kb = `${b.dept || ''}-${b.emp_no || ''}-${b.name || ''}`;
          cmp = ka.localeCompare(kb, 'zh-CN');
        } else {
          const la = a.is_admin || a.is_owner ? 3 : LEVEL_ORDER[(a.permissions || {})[sortKey]] ?? 0;
          const lb = b.is_admin || b.is_owner ? 3 : LEVEL_ORDER[(b.permissions || {})[sortKey]] ?? 0;
          cmp = la - lb;
          if (cmp === 0) cmp = (a.emp_no || '').localeCompare(b.emp_no || '');
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });

      if (!filtered.length) {
        policyTbody.innerHTML = `<tr><td colspan="${cols.length + 1}" class="u8-empty-cell">${escapeHtml(t('permEmpty'))}</td></tr>`;
        return;
      }

      filtered.forEach((item) => {
        const tr = document.createElement('tr');
        const tdUser = document.createElement('td');
        const deptLabel = deptNames[item.dept]
          ? `${deptNames[item.dept]} (${item.dept})`
          : t('permDeptPrefix', { code: item.dept || '-' });
        const roleBadge = item.is_owner
          ? `<span class="u8-badge">${escapeHtml(t('permOwnerBadge'))}</span>`
          : item.is_admin
            ? `<span class="u8-badge is-warn">${escapeHtml(t('permAdminBadge'))}</span>`
            : '';
        tdUser.innerHTML = `
          <div class="u8-member-name">
            <span>${escapeHtml(item.name || item.email)}</span>
            ${roleBadge}
          </div>
          <div class="u8-member-meta">${escapeHtml(item.emp_no || '-')} · ${escapeHtml(deptLabel)} · ${escapeHtml(item.email)}</div>
        `;
        tr.appendChild(tdUser);

        MOD_META.forEach((m) => {
          const td = document.createElement('td');
          const lv = (item.permissions && item.permissions[m.key]) || 'read';
          if (item.is_owner || item.is_admin) {
            td.innerHTML = `<span class="u8-badge">${escapeHtml(t('permFullAccess'))}</span>`;
          } else {
            const trig = document.createElement('button');
            trig.type = 'button';
            trig.className = `u8-perm-trigger lv-${lv}`;
            trig.innerHTML = `<span>${escapeHtml(getLevelLabel(lv))}</span><span style="font-size:10px;opacity:0.75;">▾</span>`;
            trig.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              const curLv = (item.permissions && item.permissions[m.key]) || 'read';
              showGlobalPopover(
                trig,
                [
                  { title: t('lvWrite'), dotColor: '#00beb4', active: curLv === 'write', onClick: () => applyCellChange(item, m, 'write') },
                  { title: t('lvRead'), dotColor: '#f5b942', active: curLv === 'read', onClick: () => applyCellChange(item, m, 'read') },
                  { title: t('lvNone'), dotColor: '#f07b7d', active: curLv === 'none', onClick: () => applyCellChange(item, m, 'none') },
                ],
                { minWidth: 112 },
              );
            });
            td.appendChild(trig);
          }
          tr.appendChild(td);
        });

        const tdAct = document.createElement('td');
        const actWrap = document.createElement('div');
        actWrap.className = 'u8-row-actions';
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'u8-link-btn';
        editBtn.textContent = t('permEditBtn');
        editBtn.addEventListener('click', () => openMemberModal(item));
        actWrap.appendChild(editBtn);

        if (!item.is_owner) {
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'u8-link-btn is-danger';
          delBtn.textContent = t('permDeleteBtn');
          delBtn.addEventListener('click', async () => {
            if (!window.confirm(t('permConfirmDelete', { name: item.name || item.email, email: item.email }))) return;
            const { status, data } = await rbacFetch('/policies/user?email=' + encodeURIComponent(item.email), {
              method: 'DELETE',
            });
            if (status === 200 && data && data.code === 0) {
              showToast(t('permMemberDeleted', { name: item.name || item.email }));
              await reloadPolicies();
            } else {
              showToast(t('permOpFailed', { msg: (data && data.message) || status }));
            }
          });
          actWrap.appendChild(delBtn);
        }
        tdAct.appendChild(actWrap);
        tr.appendChild(tdAct);
        policyTbody.appendChild(tr);
      });
    }

    async function applyCellChange(item, modMeta, nextLv) {
      const prevLv = (item.permissions || {})[modMeta.key] || 'read';
      if (prevLv === nextLv) return;
      item.permissions[modMeta.key] = nextLv;
      renderPermissionPage();
      const { status, data } = await rbacFetch('/policies/user', {
        method: 'PUT',
        body: JSON.stringify({ email: item.email, permissions: item.permissions }),
      });
      if (status === 200 && data && data.code === 0) {
        showToast(
          t('permUpdatedCell', {
            name: item.name || item.email,
            mod: t(modMeta.labelKey),
            level: getLevelLabel(nextLv),
          }),
        );
      } else {
        // Rollback optimistic update on failure
        item.permissions[modMeta.key] = prevLv;
        renderPermissionPage();
        showToast(t('permSaveFailed'));
      }
    }

    async function reloadPolicies() {
      permLoading = true;
      renderPermissionPage();
      const { status, data } = await rbacFetch('/policies');
      permLoading = false;
      if (status === 200 && data && data.code === 0) {
        allPolicies = data.data || [];
        deptNames = data.dept_names || {};
        renderPermissionPage();
      } else {
        renderPermissionPage();
        showToast(t('permLoadFailed'));
      }
    }

    async function openPermissionPage() {
      positionOverlayBelowHeader();
      permPageOpen = true;
      permPage.classList.remove('is-hidden');
      renderReadonlyBar();
      syncNavActiveStates();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await reloadPolicies();
    }

    permSearchInput.addEventListener('input', () => {
      searchKeyword = permSearchInput.value || '';
      renderPermissionPage();
    });
    btnAddMember.addEventListener('click', () => openMemberModal(null));
    btnAuditLog.addEventListener('click', openAuditLogModal);
    btnExportCsv.addEventListener('click', exportPoliciesCsv);
    closePageBtn.addEventListener('click', closePermissionPage);

    document.addEventListener(
      'click',
      (e) => {
        if (!permPageOpen) return;
        const target = e.target;
        if (!target || typeof target.closest !== 'function') return;
        const logoLink = target.closest('header a, a[aria-label*="Flow"], a[href="/"], a[href="/home"]');
        if (logoLink && !logoLink.closest('#ragflow-u8-modal-host')) {
          closePermissionPage();
          if (window.location.pathname !== '/' && window.location.pathname !== '/home') {
            navigateTo('/');
          }
        }
      },
      true,
    );

    // =========================================================================
    // DOM Enhancements & RAGFlow-style Language Switching
    // =========================================================================

    function isInsideU8Overlay(el) {
      if (!el || typeof el.closest !== 'function') return false;
      return Boolean(
        el.closest('#ragflow-u8-weak-guide-host') ||
          el.closest('#ragflow-u8-modal-host') ||
          el.closest('#ragflow-u8-toast-host') ||
          el.closest('[data-u8-popover="1"]'),
      );
    }

    function enhanceBrandName(root) {
      if (document.title && /RAGFlow/i.test(document.title)) {
        document.title = document.title.replace(/RAGFlow/gi, 'InsomniacFlow');
      }
      const scanRoot = root && root.nodeType === 1 ? root : document.body;
      if (!scanRoot || isInsideU8Overlay(scanRoot)) return;

      const walker = document.createTreeWalker(scanRoot, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent || isInsideU8Overlay(parent)) continue;
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT') continue;
        if (node.nodeValue && node.nodeValue.includes('RAGFlow')) {
          node.nodeValue = node.nodeValue.replace(/RAGFlow/g, 'InsomniacFlow');
        }
      }
      scanRoot.querySelectorAll('input[placeholder*="RAGFlow"], textarea[placeholder*="RAGFlow"]').forEach((el) => {
        el.setAttribute('placeholder', (el.getAttribute('placeholder') || '').replace(/RAGFlow/g, 'InsomniacFlow'));
      });
      scanRoot.querySelectorAll('img[alt*="RAGFlow"]').forEach((el) => {
        el.setAttribute('alt', (el.getAttribute('alt') || '').replace(/RAGFlow/g, 'InsomniacFlow'));
      });
    }

    function enhanceNavMemberLocks() {
      const isMember = Boolean(meState && !meState.is_owner && meState.permissions);
      document.querySelectorAll('nav a[href]').forEach((a) => {
        if (isInsideU8Overlay(a)) return;
        const href = a.getAttribute('href') || '';
        const mod = routeToModule(href);
        if (!mod) return;
        const locked = isMember && meState.permissions[mod] === 'none';

        if (locked) {
          if (!a.dataset.u8NavLocked) {
            a.dataset.u8NavLocked = mod;
            a.style.opacity = '0.42';
            a.style.cursor = 'not-allowed';
            if (!a.querySelector('[data-u8-lock-badge="1"]')) {
              const badge = document.createElement('span');
              badge.setAttribute('data-u8-lock-badge', '1');
              badge.style.cssText = 'display:inline-flex;align-items:center;margin-left:4px;vertical-align:middle;';
              badge.innerHTML = LOCK_ICON_SVG;
              a.appendChild(badge);
            }
            if (!a.dataset.u8LockClickBound) {
              a.dataset.u8LockClickBound = '1';
              a.addEventListener(
                'click',
                (ev) => {
                  const lockedMod = a.dataset.u8NavLocked;
                  if (lockedMod && meState && !meState.is_owner && meState.permissions && meState.permissions[lockedMod] === 'none') {
                    ev.preventDefault();
                    ev.stopPropagation();
                    showToast(t('lockedModuleToast', { mod: getModLabel(lockedMod) }));
                  }
                },
                true,
              );
            }
          }
          a.title = t('lockedModuleToast', { mod: getModLabel(mod) });
        } else if (a.dataset.u8NavLocked) {
          delete a.dataset.u8NavLocked;
          a.style.removeProperty('opacity');
          a.style.removeProperty('cursor');
          a.removeAttribute('title');
          const badge = a.querySelector('[data-u8-lock-badge="1"]');
          if (badge) badge.remove();
        }
      });
    }

    function enhanceSidebarTeamPerm() {
      const isOwner = Boolean(meState && meState.is_owner);
      if (!isOwner) {
        document.querySelectorAll('[data-u8-nav-perm="1"], [data-u8-nav-perm-li="1"]').forEach((el) => el.remove());
        return;
      }

      const navs = Array.from(document.querySelectorAll('nav')).filter((n) => {
        const txt = n.textContent || '';
        return (
          (txt.includes('知识库') || txt.includes('Dataset') || txt.includes('ฐานความรู้')) &&
          (txt.includes('文件管理') || txt.includes('File') || txt.includes('จัดการไฟล์'))
        );
      });

      navs.forEach((nav) => {
        nav.querySelectorAll('a, button:not([data-u8-nav-perm="1"])').forEach((sib) => {
          if (!sib.dataset.u8ClosePermBound) {
            sib.dataset.u8ClosePermBound = '1';
            sib.addEventListener('click', () => {
              if (permPageOpen) closePermissionPage();
            });
          }
        });

        const existing = nav.querySelector('button[data-u8-nav-perm="1"]');
        if (existing) {
          const lbl = existing.querySelector('[data-u8-nav-perm-label="1"]');
          if (lbl) lbl.textContent = t('navTeamPerm');
          syncNavActiveStates();
          return;
        }

        const ul = nav.querySelector('ul');
        const container = ul || nav;
        const sampleLink =
          container.querySelector('a[href*="/files"]') ||
          Array.from(container.querySelectorAll('a')).find((a) => (a.textContent || '').trim().length > 0) ||
          container.querySelector('a') ||
          container.querySelector('button');
        if (!sampleLink) return;

        const rect = nav.getBoundingClientRect();
        const inDrawer = Boolean(nav.closest('[role="dialog"], [data-radix-dialog-content]'));
        const isHorizontal = !inDrawer && (Boolean(nav.closest('header')) || rect.width > rect.height * 1.5);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-u8-nav-perm', '1');
        btn.dataset.u8NavMode = isHorizontal ? 'horizontal' : 'vertical';

        const siblingClasses = (sampleLink.className || '')
          .split(/\s+/)
          .filter(
            (c) =>
              c &&
              !c.includes('bg-bg-card') &&
              !c.includes('bg-white') &&
              !c.includes('bg-text-primary') &&
              !c.includes('text-bg-base') &&
              !c.includes('shadow-') &&
              !c.includes('border-l-'),
          )
          .join(' ');
        btn.className = siblingClasses;
        btn.style.cursor = 'pointer';
        btn.style.border = 'none';
        btn.style.transition = 'all 0.16s ease';

        const labelText = t('navTeamPerm');
        if (isHorizontal) {
          const cs = window.getComputedStyle(sampleLink);
          btn.style.height = cs.height && cs.height !== 'auto' ? cs.height : '36px';
          btn.style.paddingLeft = cs.paddingLeft || '16px';
          btn.style.paddingRight = cs.paddingRight || '16px';
          btn.style.fontSize = cs.fontSize || '14px';
          btn.style.display = 'inline-flex';
          btn.style.alignItems = 'center';
          btn.style.justifyContent = 'center';
          btn.style.whiteSpace = 'nowrap';
          btn.innerHTML = `<span data-u8-nav-perm-label="1">${escapeHtml(labelText)}</span>`;
        } else {
          const cs = window.getComputedStyle(sampleLink);
          btn.style.width = '100%';
          btn.style.display = 'flex';
          btn.style.alignItems = 'center';
          btn.style.gap = cs.gap && cs.gap !== 'normal' ? cs.gap : '12px';
          btn.style.paddingLeft = cs.paddingLeft || '20px';
          btn.style.paddingRight = cs.paddingRight || '16px';
          btn.style.height = cs.height && cs.height !== 'auto' ? cs.height : '44px';
          btn.style.fontSize = cs.fontSize || '14px';
          btn.style.textAlign = 'left';
          btn.innerHTML = `${SHIELD_ICON_SVG}<span data-u8-nav-perm-label="1" class="truncate">${escapeHtml(labelText)}</span>`;
        }

        btn.addEventListener('mouseenter', () => {
          if (permPageOpen) return;
          const isDark = document.documentElement.classList.contains('dark');
          if (isHorizontal) {
            btn.style.setProperty('color', isDark ? '#ffffff' : '#161618', 'important');
          } else {
            btn.style.setProperty('background', isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', 'important');
          }
        });
        btn.addEventListener('mouseleave', () => syncNavActiveStates());
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openPermissionPage();
        });

        if (ul) {
          const li = document.createElement('li');
          li.setAttribute('data-u8-nav-perm-li', '1');
          const sampleLi = sampleLink.closest('li');
          if (sampleLi && sampleLi.className) li.className = sampleLi.className;
          li.appendChild(btn);
          ul.appendChild(li);
        } else {
          container.appendChild(btn);
        }
        syncNavActiveStates();
      });
    }

    function enhanceUserSettingGuideToggle() {
      if (!window.location.pathname.startsWith('/user-setting')) return;
      const asides = Array.from(document.querySelectorAll('aside nav'));
      const settingNav = asides.find((n) => {
        const txt = n.textContent || '';
        return (
          (txt.includes('模型供应商') || txt.includes('Model') || txt.includes('ผู้ให้บริการโมเดล')) &&
          txt.includes('API')
        );
      });
      if (!settingNav) return;

      const ul = settingNav.querySelector('ul') || settingNav;
      if (ul.querySelector('[data-u8-guide-toggle="1"]')) {
        const lbl = ul.querySelector('[data-u8-guide-toggle-label="1"]');
        if (lbl) lbl.textContent = t('brandLabel');
        return;
      }

      const li = document.createElement(ul.tagName === 'UL' ? 'li' : 'div');
      li.setAttribute('data-u8-guide-toggle', '1');
      li.className = 'w-full md:w-auto';

      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;justify-content:space-between;height:40px;padding:0 12px;border-radius:8px;cursor:pointer;gap:10px;transition:background 0.15s ease;';
      row.innerHTML = `
        <span style="display:flex;align-items:center;gap:10px;font-size:15px;min-width:0;">
          ${GUIDE_ICON_SVG}
          <span data-u8-guide-toggle-label="1" class="hidden md:inline truncate">${escapeHtml(t('brandLabel'))}</span>
        </span>
        <span data-u8-switch-track="1" style="position:relative;display:inline-flex;align-items:center;width:36px;height:20px;border-radius:999px;flex-shrink:0;transition:background 0.18s ease;">
          <span data-u8-switch-thumb="1" style="position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.3);transition:transform 0.18s ease;"></span>
        </span>
      `;

      const track = row.querySelector('[data-u8-switch-track="1"]');
      const thumb = row.querySelector('[data-u8-switch-thumb="1"]');

      function syncSwitchUI() {
        const on = isGuideVisible();
        track.style.background = on ? '#00beb4' : 'rgba(140, 145, 155, 0.35)';
        thumb.style.transform = on ? 'translateX(16px)' : 'translateX(0)';
      }

      row.addEventListener('click', () => {
        const next = !isGuideVisible();
        try {
          localStorage.setItem(STORAGE_VISIBLE, next ? '1' : '0');
        } catch (_) {}
        syncSwitchUI();
        applyGuideVisibility();
        showToast(next ? t('guideOnToast') : t('guideOffToast'));
      });

      syncSwitchUI();
      li.appendChild(row);
      ul.appendChild(li);
    }

    function enhanceExternalLinks() {
      document.querySelectorAll('a').forEach((a) => {
        const href = (a.getAttribute('href') || '').toLowerCase();
        const txt = (a.textContent || '').trim();

        if (href.includes('discord') || txt === 'Discord') {
          a.style.setProperty('display', 'none', 'important');
          a.removeAttribute('href');
          a.setAttribute('data-u8-removed', '1');
          return;
        }

        if ((href.includes('github.com/infiniflow/ragflow') || txt === 'GitHub') && !a.dataset.u8GithubBound) {
          a.dataset.u8GithubBound = '1';
          const origGithub = a.getAttribute('href') || 'https://github.com/infiniflow/ragflow';
          a.addEventListener(
            'click',
            (e) => {
              e.preventDefault();
              e.stopPropagation();
              showGlobalPopover(a, [
                {
                  title: t('githubMenuRagflow'),
                  desc: t('githubMenuRagflowDesc'),
                  onClick: () => window.open(origGithub, '_blank', 'noopener,noreferrer'),
                },
                {
                  title: t('githubMenuAuthor'),
                  desc: t('githubMenuAuthorDesc'),
                  onClick: () => window.open('https://github.com/Insomniac1008', '_blank', 'noopener,noreferrer'),
                },
              ]);
            },
            true,
          );
          return;
        }

        if ((href.includes('ragflow.io/docs') || href.includes('/docs/')) && !a.dataset.u8HelpBound) {
          a.dataset.u8HelpBound = '1';
          const origHelp = a.getAttribute('href') || 'https://ragflow.io/docs/dev/category/user-guides';
          a.addEventListener(
            'click',
            (e) => {
              e.preventDefault();
              e.stopPropagation();
              showGlobalPopover(a, [
                {
                  title: t('helpMenuRagflow'),
                  desc: t('helpMenuRagflowDesc'),
                  onClick: () => window.open(origHelp, '_blank', 'noopener,noreferrer'),
                },
                {
                  title: t('helpMenuU8'),
                  desc: t('helpMenuU8Desc'),
                  onClick: () => openHelpModal(),
                },
              ]);
            },
            true,
          );
        }
      });
    }

    function enhanceRequiredModelStars() {
      if (!window.location.pathname.includes('/model')) return;
      const targets = new Set([
        'Embedding', 'VLM', 'ASR', 'Rerank', 'TTS',
        '决策模型', 'Decision Model', 'โมเดลการตัดสินใจ',
      ]);

      document.querySelectorAll('article label, article span, [role="dialog"] label, [role="dialog"] span').forEach((el) => {
        if (el.dataset.u8StarChecked) return;
        const txt = (el.textContent || '').trim();
        if (!targets.has(txt)) return;
        const parentTxt = (el.parentElement && el.parentElement.textContent) || '';
        if (txt.startsWith('*') || parentTxt.trim().startsWith('*')) {
          el.dataset.u8StarChecked = '1';
          return;
        }
        const row = el.closest('div');
        if (!row) return;
        const star = document.createElement('span');
        star.setAttribute('data-u8-req', '1');
        star.textContent = '*';
        star.style.cssText = 'color:#ef4444;margin-right:2px;font-weight:500;';
        el.insertBefore(star, el.firstChild);
        el.dataset.u8StarChecked = '1';
      });
    }

    // Apply Thai translation to RAGFlow's built-in DOM text nodes (preserving originals for clean switch-back)
    function applyThaiToDOM(root) {
      const scanRoot = root && root.nodeType === 1 ? root : document.body;
      if (!scanRoot || isInsideU8Overlay(scanRoot)) return;
      const walker = document.createTreeWalker(scanRoot, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent || isInsideU8Overlay(parent)) continue;
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT') continue;
        const raw = node.nodeValue;
        if (!raw) continue;
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const translated = THAI_DICT[trimmed];
        if (translated && translated !== trimmed) {
          if (!ORIGINAL_TEXT_MAP.has(node)) {
            ORIGINAL_TEXT_MAP.set(node, raw);
          }
          node.nodeValue = raw.replace(trimmed, translated);
        }
      }
    }

    // Restore original text nodes when switching away from Thai (no forced page reload needed)
    function restoreOriginalDOMText() {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) {
        if (ORIGINAL_TEXT_MAP.has(node)) {
          node.nodeValue = ORIGINAL_TEXT_MAP.get(node);
          ORIGINAL_TEXT_MAP.delete(node);
        }
      }
    }

    // Mirror RAGFlow's changeLanguageAsync (web/src/locales/config.ts)
    function applyLanguageChange(lng) {
      try {
        if (lng === 'th') {
          localStorage.setItem(STORAGE_LNG, 'th');
          localStorage.setItem(STORAGE_THAI, '1');
          document.documentElement.lang = 'th';
          document.documentElement.dir = 'ltr';
          applyThaiToDOM(document.body);
        } else {
          localStorage.removeItem(STORAGE_THAI);
          restoreOriginalDOMText();
        }
      } catch (_) {}
      renderRoute();
      enhanceSidebarTeamPerm();
      enhanceNavMemberLocks();
      enhanceUserSettingGuideToggle();
      if (permPageOpen) renderPermissionPage();
    }

    function enhanceLanguageDropdownAndThai(root) {
      document.querySelectorAll('[role="menu"], [data-radix-menu-content]').forEach((menu) => {
        const txt = menu.textContent || '';
        if (!txt.includes('English') || (!txt.includes('简体中文') && !txt.includes("O'zbek") && !txt.includes('Azərbaycan'))) {
          return;
        }

        menu.querySelectorAll('[role="menuitem"]').forEach((item) => {
          if (item.dataset.u8LangItemBound || item.dataset.u8ThaiItem) return;
          item.dataset.u8LangItemBound = '1';
          item.addEventListener(
            'click',
            () => {
              if (isThaiMode()) {
                // Cleanly restore original DOM text & let RAGFlow's native i18n switch take over
                applyLanguageChange('other');
              }
            },
            true,
          );
        });

        if (menu.querySelector('[data-u8-thai-item="1"]') || txt.includes('ภาษาไทย')) return;

        const items = menu.querySelectorAll('[role="menuitem"]');
        const lastItem = items[items.length - 1];
        if (!lastItem) return;

        const thaiItem = document.createElement('div');
        thaiItem.setAttribute('role', 'menuitem');
        thaiItem.setAttribute('tabindex', '-1');
        thaiItem.setAttribute('data-u8-thai-item', '1');
        thaiItem.className = lastItem.className;
        thaiItem.textContent = 'ภาษาไทย';
        thaiItem.style.cursor = 'pointer';
        thaiItem.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          applyLanguageChange('th');
          showToast(t('langSwitchedThai'));
        });
        lastItem.parentNode.appendChild(thaiItem);
      });

      if (isThaiMode()) {
        applyThaiToDOM(root || document.body);
      }
    }

    // Throttled MutationObserver (120ms) that scopes heavy TreeWalker scans to newly mutated subtrees
    let enhanceTimer = null;
    let pendingFullScan = false;
    const pendingRoots = new Set();

    function runScheduledEnhancements() {
      enhanceTimer = null;
      const doFull = pendingFullScan || pendingRoots.size > 12;
      const roots = doFull ? [document.body] : Array.from(pendingRoots);
      pendingFullScan = false;
      pendingRoots.clear();

      try {
        roots.forEach((r) => {
          if (r && r.isConnected) {
            enhanceBrandName(r);
            if (isThaiMode()) applyThaiToDOM(r);
          }
        });
        enhanceSidebarTeamPerm();
        enhanceNavMemberLocks();
        enhanceUserSettingGuideToggle();
        enhanceExternalLinks();
        enhanceRequiredModelStars();
        enhanceLanguageDropdownAndThai(doFull ? document.body : roots[0]);
      } catch (_) {}
    }

    function enhancePageDOM(root) {
      if (!root || root === document.body) {
        pendingFullScan = true;
      } else if (!isInsideU8Overlay(root)) {
        pendingRoots.add(root);
      }
      if (!enhanceTimer) {
        enhanceTimer = setTimeout(runScheduledEnhancements, 120);
      }
    }

    // Restore saved position & clamp on resize
    try {
      const savedPos = JSON.parse(localStorage.getItem(STORAGE_POS) || 'null');
      if (savedPos && typeof savedPos.right === 'number' && typeof savedPos.bottom === 'number') {
        host.style.right = savedPos.right + 'px';
        host.style.bottom = savedPos.bottom + 'px';
        clampHostPosition();
      }
    } catch (_) {}

    // Pointer Events dragging for BOTH expanded card header AND collapsed pill
    function bindDraggable(el, onClickIfNotDragged) {
      let dragging = false;
      let moved = false;
      let startX = 0;
      let startY = 0;
      let startRight = 20;
      let startBottom = 20;

      el.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        if (el === header && e.target && e.target.closest('button')) return;
        dragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        startRight = parseFloat(host.style.right) || 20;
        startBottom = parseFloat(host.style.bottom) || 20;
        try {
          el.setPointerCapture(e.pointerId);
        } catch (_) {}
      });

      el.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
        if (!moved) return;
        host.style.right = Math.min(Math.max(12, startRight - dx), Math.max(12, window.innerWidth - 100)) + 'px';
        host.style.bottom = Math.min(Math.max(12, startBottom - dy), Math.max(12, window.innerHeight - 60)) + 'px';
      });

      const finish = (e) => {
        if (!dragging) return;
        dragging = false;
        try {
          el.releasePointerCapture(e.pointerId);
        } catch (_) {}
        if (moved) {
          try {
            localStorage.setItem(
              STORAGE_POS,
              JSON.stringify({
                right: parseFloat(host.style.right) || 20,
                bottom: parseFloat(host.style.bottom) || 20,
              }),
            );
          } catch (_) {}
        } else if (typeof onClickIfNotDragged === 'function') {
          onClickIfNotDragged();
        }
      };

      el.addEventListener('pointerup', finish);
      el.addEventListener('pointercancel', finish);
    }

    bindDraggable(header, null);
    bindDraggable(pillOpen, () => setCollapsed(false));

    collapseBtn.addEventListener('click', () => setCollapsed(true));
    minimizeBtn.addEventListener('click', () => setCollapsed(true));
    actionBtn.addEventListener('click', () => {
      if (currentActionRoute) {
        closePermissionPage();
        navigateTo(currentActionRoute);
      }
    });

    window.addEventListener('resize', () => {
      clampHostPosition();
      positionOverlayBelowHeader();
    });

    let initialCollapsed = false;
    try {
      initialCollapsed = localStorage.getItem(STORAGE_COLLAPSED) === '1';
    } catch (_) {}
    setCollapsed(initialCollapsed);
    applyGuideVisibility();

    // Sync initial Thai mode if persisted
    if (isThaiMode()) {
      document.documentElement.lang = 'th';
    }

    syncTheme();
    // Observe BOTH theme changes AND RAGFlow's native documentElement.lang changes!
    new MutationObserver((mutations) => {
      let langChanged = false;
      for (const m of mutations) {
        if (m.attributeName === 'lang') langChanged = true;
      }
      syncTheme();
      if (langChanged) {
        renderRoute();
        enhanceSidebarTeamPerm();
        enhanceNavMemberLocks();
        enhanceUserSettingGuideToggle();
        if (permPageOpen) renderPermissionPage();
      }
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'lang'],
    });

    new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length) {
          m.addedNodes.forEach((n) => {
            if (n.nodeType === 1 && !isInsideU8Overlay(n)) {
              enhancePageDOM(n);
            }
          });
        }
      }
    }).observe(document.body, {
      childList: true,
      subtree: true,
    });

    let lastPath = window.location.pathname;
    const tick = () => {
      const tok = getAuthToken();
      if (tok !== lastToken) {
        lastToken = tok;
        refreshMe();
      }
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        closePermissionPage();
        renderRoute();
        enhancePageDOM(document.body);
      }
    };

    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function () {
      const res = origPush.apply(this, arguments);
      tick();
      return res;
    };
    history.replaceState = function () {
      const res = origReplace.apply(this, arguments);
      tick();
      return res;
    };
    window.addEventListener('popstate', tick);
    setInterval(tick, 900);

    // Silent live permission sync on tab refocus and every 60s
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && getAuthToken()) {
        refreshMe();
      }
    });
    setInterval(() => {
      if (document.visibilityState === 'visible' && getAuthToken()) {
        refreshMe();
      }
    }, 60000);

    tick();
    renderRoute();
    enhancePageDOM(document.body);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
