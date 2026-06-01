
var curPage='home',openGroup='workspace',curTab='全部',curSubTab='按日统计',toastTimer,currentRole='operator',grabCounter=0;

var roleDefs=[
  {key:'admin',name:'平台管理员',icon:'👑',css:'admin',desc:'系统最高权限，处理特殊事件'},
  {key:'operator',name:'平台运营',icon:'⚙️',css:'op',desc:'订单录入、代练管理、工会管理、系统配置'},
  {key:'cs',name:'平台客服',icon:'🎧',css:'cs',desc:'订单审核、验收、结算'},
  {key:'finance',name:'平台财务',icon:'💰',css:'fin',desc:'提现审核、工会/代练/客服结算'},
  {key:'guild_admin',name:'工会管理员',icon:'🏛️',css:'guild',desc:'工会最高权限，管理本工会代练'},
  {key:'guild_operator',name:'工会运营',icon:'🏢',css:'guild',desc:'订单录入，管理本工会人员和订单'},
  {key:'booster',name:'代练',icon:'🎮',css:'booster',desc:'接单、执行、交付、提现'}
];

function getRole(){return roleDefs.find(function(r){return r.key===currentRole;})||roleDefs[0];}

function roleVisible(pageId){
  var r=currentRole;
  // 我的资产：仅工会和打手
  if(pageId==='my-assets') return r==='guild_admin'||r==='guild_operator'||r==='booster';
  // 订单录入：打手和客服不可见
  if(pageId==='order-entry') return r!=='booster'&&r!=='cs';
  // 财务管理：打手不可见
  if(pageId==='guild-settlement'||pageId==='booster-settlement'||pageId==='cs-settlement'||pageId==='withdraw-audit') return r!=='booster';
  // 人员管理和系统管理：客服和打手不可见
  if(pageId==='org-mgmt'||pageId==='position-mgmt'||pageId==='user-mgmt'||pageId==='booster-review'||pageId==='bind-set'||pageId==='game-config'||pageId==='service-type-mgmt'||pageId==='permission-mgmt') return r!=='booster'&&r!=='cs';
  // 订单池：客服和财务不可见
  if(pageId==='order-pool') return r!=='cs'&&r!=='finance';
  return true;
}

function roleHasGroup(groupKey){
  var items=menuTree.find(function(g){return g.key===groupKey;});
  if(!items) return false;
  return items.children.some(function(c){return roleVisible(c.id);});
}

var menuTree=[
  {key:'workspace',icon:'📊',label:'工作台',children:[
    {id:'home',label:'首页',icon:'🏠'},
    {id:'my-assets',label:'我的资产',icon:'💎'}
  ]},
  {key:'order',icon:'📋',label:'订单管理',badge:'28',children:[
    {id:'order-entry',label:'订单录入',icon:'➕'},
    {id:'order-mgmt',label:'订单管理',icon:'📋'},
    {id:'order-pool',label:'订单池',icon:'📦',badge:'8'}
  ]},
  {key:'data',icon:'📈',label:'数据报表',children:[
    {id:'data-overview',label:'数据概览',icon:'📊'}
  ]},
  {key:'finance',icon:'💰',label:'财务管理',badge:'6',children:[
    {id:'guild-settlement',label:'工会结算',icon:'🏛️'},
    {id:'booster-settlement',label:'打手结算',icon:'💵'},
    {id:'cs-settlement',label:'客服结算',icon:'💳'},
    {id:'withdraw-audit',label:'提现审核',icon:'🔐',badge:'3'}
  ]},
  {key:'personnel',icon:'👥',label:'人员管理',children:[
    {id:'org-mgmt',label:'机构管理',icon:'🏢'},
    {id:'position-mgmt',label:'岗位管理',icon:'📝'},
    {id:'user-mgmt',label:'用户管理',icon:'👤'},
    {id:'booster-review',label:'打手审核',icon:'✅',badge:'2'},
    {id:'bind-set',label:'下家绑定',icon:'🔗'}
  ]},
  {key:'system',icon:'⚙️',label:'系统管理',children:[
    {id:'game-config',label:'游戏设置',icon:'🎮'},
    {id:'service-type-mgmt',label:'服务类型',icon:'🛠'},
    {id:'permission-mgmt',label:'权限管理',icon:'🔐'}
  ]}
];

var pageTitles={
  home:'工作台 > 首页','my-assets':'工作台 > 我的资产',
  'order-entry':'订单管理 > 订单录入','order-mgmt':'订单管理 > 订单管理','order-pool':'订单管理 > 订单池',
  'data-overview':'数据报表 > 数据概览','order-report':'数据报表 > 订单报表',
  'guild-settlement':'财务管理 > 工会结算','booster-settlement':'财务管理 > 打手结算','cs-settlement':'财务管理 > 客服结算','withdraw-audit':'财务管理 > 提现审核',
  'org-mgmt':'人员管理 > 机构管理','position-mgmt':'人员管理 > 岗位管理','user-mgmt':'人员管理 > 用户管理','booster-review':'人员管理 > 打手审核','bind-set':'人员管理 > 下家绑定',
  'game-config':'系统管理 > 游戏设置','service-type-mgmt':'系统管理 > 服务类型','permission-mgmt':'系统管理 > 权限管理'
};

var pageIcons={
  home:'📊','my-assets':'💎','order-entry':'➕','order-mgmt':'📋','order-pool':'📦',
  'data-overview':'📊','order-report':'📑','guild-settlement':'🏛️','booster-settlement':'💵','cs-settlement':'💳','withdraw-audit':'🔐',
  'org-mgmt':'🏢','position-mgmt':'📝','user-mgmt':'👤','booster-review':'✅','bind-set':'🔗','game-config':'🎮','service-type-mgmt':'🛠','permission-mgmt':'🔐'
};

function renderTree(){
  var h='',role=getRole();
  menuTree.forEach(function(g){
    // Filter visible children
    var visChildren=g.children.filter(function(c){return roleVisible(c.id);});
    if(visChildren.length===0) return;
    var open=openGroup===g.key;
    h+='<div class="tree-group">';
    h+='<div class="tree-parent'+(open?' open':'')+'" data-key="'+g.key+'">'+g.icon+' '+g.label;
    if(g.badge) h+=' <span style="background:var(--danger);color:#fff;padding:0 5px;border-radius:8px;font-size:10px;margin-left:4px;">'+g.badge+'</span>';
    h+='<span class="arr">▶</span></div>';
    h+='<div class="tree-children'+(open?' open':'')+'">';
    visChildren.forEach(function(c){
      h+='<div class="tree-item'+(curPage===c.id?' active':'')+'" data-page="'+c.id+'"><span class="dot"></span>'+c.label;
      if(c.badge) h+=' <span style="background:var(--danger);color:#fff;padding:0 5px;border-radius:8px;font-size:10px;margin-left:4px;">'+c.badge+'</span>';
      h+='</div>';
    });
    h+='</div></div>';
  });
  document.getElementById('tree-menu').innerHTML=h;
  document.getElementById('top-role').textContent=role.name;
  document.getElementById('top-role').className='role-badge '+role.css;
  document.querySelectorAll('.tree-parent').forEach(function(el){
    el.addEventListener('click',function(e){
      e.stopPropagation();
      var k=this.getAttribute('data-key');
      toggleGroup(k);
    });
  });
  document.querySelectorAll('.tree-item').forEach(function(el){
    el.addEventListener('click',function(e){
      e.stopPropagation();
      var p=this.getAttribute('data-page');
      if(p===curPage) return;
      curPage=p;
      openGroup=findGroup(p);
      renderTree();
      renderContent();
    });
  });
}

function findGroup(pageId){
  for(var i=0;i<menuTree.length;i++){
    var g=menuTree[i];
    for(var j=0;j<g.children.length;j++){
      if(g.children[j].id===pageId) return g.key;
    }
  }
  return openGroup;
}

function toggleGroup(key){
  openGroup=openGroup===key?'':key;
  renderTree();
}

function renderRolePanel(){
  var h='';
  roleDefs.forEach(function(r){
    h+='<div class="rp-item'+(r.key===currentRole?' active':'')+'" onclick="switchRole(\''+r.key+'\')"><div class="rp-icon '+r.css+'">'+r.icon+'</div><div class="rp-info"><div class="rp-name">'+r.name+'</div><div class="rp-desc">'+r.desc+'</div></div>'+(r.key===currentRole?'<span class="rp-check">✓</span>':'')+'</div>';
  });
  document.getElementById('role-list').innerHTML=h;
}

function toggleRolePanel(){
  var p=document.getElementById('role-panel');
  if(p.classList.contains('show')){p.classList.remove('show');return;}
  renderRolePanel();
  p.classList.add('show');
}

function switchRole(key){
  currentRole=key;
  // Auto-navigate to valid page if current is hidden
  if(!roleVisible(curPage)) curPage='home';
  openGroup='workspace';
  curTab='全部';
  document.getElementById('role-panel').classList.remove('show');
  renderTree();
  renderContent();
}

// Close role panel on outside click
document.addEventListener('click',function(e){
  var p=document.getElementById('role-panel');
  var b=document.getElementById('floating-ball');
  if(!p.contains(e.target)&&e.target!==b&&!b.contains(e.target)){
    p.classList.remove('show');
  }
});

function openModal(title,bodyHTML,footerHTML){
  var overlay=document.getElementById('modal-overlay');
  var box=document.getElementById('modal-box');
  box.innerHTML='<div class="modal-header">'+title+'<span class="close" onclick="closeModal()">✕</span></div><div class="modal-body">'+bodyHTML+'</div>'+(footerHTML?'<div class="modal-footer">'+footerHTML+'</div>':'');
  overlay.classList.add('show');
}

function closeModal(){
  document.getElementById('modal-overlay').classList.remove('show');
}

function showOrderDetail(oid){
  var body='<div style="display:flex;gap:16px;"><div style="flex:1;"><div class="ant-form-item"><div class="ant-form-label">订单编号</div><div style="font-weight:500;">'+oid+'</div></div><div class="ant-form-item"><div class="ant-form-label">订单状态</div><span class="ant-tag ant-tag-primary">执行中</span></div><div class="ant-form-item"><div class="ant-form-label">订单标题</div><div>排位青铜→钻石</div></div><div class="ant-form-item"><div class="ant-form-label">订单类型</div><div>代练</div></div><div class="ant-form-item"><div class="ant-form-label">游戏信息</div><div>三角洲行动端游 / WeGame / QQ账号</div></div></div><div style="flex:1;"><div class="ant-form-item"><div class="ant-form-label">角色名称</div><div>玩家A</div></div><div class="ant-form-item"><div class="ant-form-label">用户手机号</div><div>138****8888</div></div><div class="ant-form-item"><div class="ant-form-label">订单金额</div><div style="font-weight:500;">¥298.00</div></div><div class="ant-form-item"><div class="ant-form-label">当前打手</div><div>王代练</div></div><div class="ant-form-item"><div class="ant-form-label">指派客服</div><div>小李</div></div></div></div><div class="ant-form-item"><div class="ant-form-label">订单备注</div><div style="color:var(--text-secondary);">客户要求48小时内完成</div></div><div class="ant-form-item"><div class="ant-form-label">创建时间</div><div>2026-05-26 14:30</div></div>';
  openModal('📋 订单详情 - '+oid,body,'<button class="ant-btn" onclick="closeModal()">关闭</button>');
}

document.getElementById('modal-overlay').addEventListener('click',function(e){
  if(e.target===this) closeModal();
});

function setBreadcrumb(title){
  var parts=title.split(' > ');
  var h='';
  parts.forEach(function(p,i){
    if(i>0) h+='<span class="sep">/</span>';
    if(i===parts.length-1) h+='<span>'+p+'</span>';
    else h+=p;
  });
  document.getElementById('breadcrumb').innerHTML=h;
}

function toast(msg,red){
  var t=document.getElementById('toast');
  if(red) msg=msg.replace(red,'<span style="color:var(--danger);font-weight:600;">'+red+'</span>');
  t.innerHTML=msg;t.style.display='block';
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){t.style.display='none';},5000);
}

function renderContent(){
  var title=pageTitles[curPage]||curPage;
  setBreadcrumb(title);
  var c=document.getElementById('content-area');
  var fn=window['r'+curPage.split('-').map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join('').replace(/-/g,'')];
  c.innerHTML=fn?fn():'<div class="ant-card"><div class="ant-card-body" style="text-align:center;padding:80px;color:var(--text-secondary);">功能开发中</div></div>';
}

function sendLoginSms(){
  var phone=document.getElementById('login-phone').value.replace(/\s/g,'');
  if(!/^1[3-9]\d{9}$/.test(phone)){toast('请输入正确的手机号');return;}
  var btn=document.getElementById('login-sms-btn');
  btn.disabled=true;
  var sec=60;
  btn.textContent=sec+'s';
  var timer=setInterval(function(){
    sec--;
    if(sec<=0){btn.disabled=false;btn.textContent='获取验证码';clearInterval(timer);}
    else btn.textContent=sec+'s';
  },1000);
  toast('验证码已发送');
}
function doLogin(){
  var phone=document.getElementById('login-phone').value.replace(/\s/g,'');
  var code=document.getElementById('login-code').value;
  if(!/^1[3-9]\d{9}$/.test(phone)){toast('请输入正确的手机号');return;}
  if(code!=='8888'){toast('验证码错误');return;}
  document.getElementById('login-overlay').style.display='none';
  openGroup='workspace';renderTree();renderContent();
}
function doLogout(){document.getElementById('login-overlay').style.display='flex';}

// ─── PAGE RENDER FUNCTIONS ───

function rHome(){
  var r=currentRole;
  // ── 平台管理员：全量待处理汇总，点击卡片跳转对应页面集中处理 ──
  if(r==='admin'){
    return '<div class="stat-row"><div class="stat-item" onclick="curPage=\'order-mgmt\';curTab=\'待审核\';openGroup=\'order\';renderTree();renderContent()"><div class="label">待审核订单</div><div class="value" style="color:var(--danger);">5</div><div class="sub">客服待处理 →</div></div><div class="stat-item" onclick="curPage=\'order-mgmt\';openGroup=\'order\';renderTree();renderContent()"><div class="label">待验收订单</div><div class="value" style="color:var(--warning);">12</div><div class="sub">客服待处理 →</div></div><div class="stat-item" onclick="curPage=\'booster-review\';openGroup=\'personnel\';renderTree();renderContent()"><div class="label">待审核代练</div><div class="value" style="color:var(--danger);">2</div><div class="sub">运营待处理 →</div></div><div class="stat-item" onclick="curPage=\'withdraw-audit\';openGroup=\'finance\';renderTree();renderContent()"><div class="label">待审核提现</div><div class="value" style="color:var(--warning);">3</div><div class="sub">¥8,500 财务待处理 →</div></div></div><div class="stat-row"><div class="stat-item" onclick="curPage=\'guild-settlement\';openGroup=\'finance\';renderTree();renderContent()"><div class="label">工会结算申请</div><div class="value" style="color:var(--warning);">2</div><div class="sub">¥13,510 财务待处理 →</div></div><div class="stat-item"><div class="label">今日新增订单</div><div class="value">28</div><div class="sub" style="color:var(--success);">↑ 32% 较昨日</div></div><div class="stat-item"><div class="label">执行中订单</div><div class="value" style="color:var(--primary);">45</div><div class="sub">在册代练 32 人 · 5 工会</div></div><div class="stat-item"><div class="label">今日流水</div><div class="value">¥18,520</div><div class="sub">待结算 ¥6,800</div></div></div><div style="margin-top:16px;"><div class="ant-card"><div class="ant-card-head">⚡ 快捷操作</div><div class="ant-card-body"><div style="display:flex;gap:16px;flex-wrap:wrap;"><div class="stat-item" onclick="curPage=\'order-mgmt\';curTab=\'待审核\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;"><div style="width:40px;height:40px;background:var(--danger-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">📋</div><div><div style="font-weight:500;">订单审核</div><div style="font-size:var(--font-size-sm);color:var(--danger);">5 单待审核</div></div></div><div class="stat-item" onclick="curPage=\'booster-review\';openGroup=\'personnel\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;"><div style="width:40px;height:40px;background:var(--warning-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">🔍</div><div><div style="font-weight:500;">代练审核</div><div style="font-size:var(--font-size-sm);color:var(--danger);">2 人待审核</div></div></div><div class="stat-item" onclick="curPage=\'withdraw-audit\';openGroup=\'finance\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;"><div style="width:40px;height:40px;background:var(--danger-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">💳</div><div><div style="font-weight:500;">提现审核</div><div style="font-size:var(--font-size-sm);color:var(--warning);">3 笔 ¥8,500</div></div></div><div class="stat-item" onclick="curPage=\'guild-settlement\';openGroup=\'finance\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">🏛️</div><div><div style="font-weight:500;">工会结算</div><div style="font-size:var(--font-size-sm);color:var(--warning);">2 笔 ¥13,510</div></div></div></div></div></div></div>';
  }
  // ── 平台运营：待审核代练 + 订单池分配 + 录入订单 ──
  if(r==='operator'){
    return '<div class="stat-row"><div class="stat-item" onclick="curPage=\'booster-review\';openGroup=\'personnel\';renderTree();renderContent()"><div class="label">待审核代练身份</div><div class="value" style="color:var(--danger);">2</div><div class="sub">需尽快审核 →</div></div><div class="stat-item" onclick="curPage=\'order-pool\';openGroup=\'order\';renderTree();renderContent()"><div class="label">订单池可分配</div><div class="value" style="color:var(--primary);">8</div><div class="sub">待指派打手/工会 →</div></div><div class="stat-item"><div class="label">今日新增订单</div><div class="value">28</div><div class="sub" style="color:var(--success);">↑ 32% 较昨日</div></div><div class="stat-item"><div class="label">执行中订单</div><div class="value" style="color:var(--primary);">45</div><div class="sub">待验收 12 · 告警 2</div></div></div><div style="margin-top:16px;"><div class="ant-card"><div class="ant-card-head">⚡ 快捷操作</div><div class="ant-card-body"><div style="display:flex;gap:16px;flex-wrap:wrap;"><div class="stat-item" onclick="curPage=\'order-entry\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">➕</div><div><div style="font-weight:500;">录入订单</div><div style="font-size:var(--font-size-sm);color:var(--text-secondary);">手动 / Excel / API</div></div></div><div class="stat-item" onclick="curPage=\'order-pool\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--primary);"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">📦</div><div><div style="font-weight:500;">订单池分配</div><div style="font-size:var(--font-size-sm);color:var(--primary);">8 单待分配</div></div></div><div class="stat-item" onclick="curPage=\'booster-review\';openGroup=\'personnel\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--danger);"><div style="width:40px;height:40px;background:var(--danger-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">🔍</div><div><div style="font-weight:500;">代练身份审核</div><div style="font-size:var(--font-size-sm);color:var(--danger);">2 人待审核</div></div></div></div></div></div></div>';
  }
  // ── 平台客服：待审核订单 + 待验收订单 ──
  if(r==='cs'){
    return '<div class="stat-row"><div class="stat-item" onclick="curPage=\'order-mgmt\';curTab=\'待审核\';openGroup=\'order\';renderTree();renderContent()"><div class="label">待审核订单</div><div class="value" style="color:var(--danger);">5</div><div class="sub">点击进入订单审核 →</div></div><div class="stat-item" onclick="curPage=\'order-mgmt\';openGroup=\'order\';renderTree();renderContent()"><div class="label">待验收订单</div><div class="value" style="color:var(--warning);">12</div><div class="sub">代练已提交交付 →</div></div><div class="stat-item"><div class="label">今日处理订单</div><div class="value" style="color:var(--success);">15</div><div class="sub">通过 12 · 驳回 3</div></div><div class="stat-item"><div class="label">待结算订单</div><div class="value">8</div><div class="sub">已验收待确认结算</div></div></div><div style="margin-top:16px;"><div class="ant-card"><div class="ant-card-head">⚡ 快捷操作</div><div class="ant-card-body"><div style="display:flex;gap:16px;flex-wrap:wrap;"><div class="stat-item" onclick="curPage=\'order-mgmt\';curTab=\'待审核\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--danger);"><div style="width:40px;height:40px;background:var(--danger-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">📋</div><div><div style="font-weight:500;">订单审核</div><div style="font-size:var(--font-size-sm);color:var(--danger);">5 单待审核</div></div></div><div class="stat-item" onclick="curPage=\'order-mgmt\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--warning);"><div style="width:40px;height:40px;background:var(--warning-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">✅</div><div><div style="font-weight:500;">订单验收</div><div style="font-size:var(--font-size-sm);color:var(--warning);">12 单待验收</div></div></div></div></div></div></div>';
  }
  // ── 平台财务：工会结算申请 + 提现申请 ──
  if(r==='finance'){
    return '<div class="stat-row"><div class="stat-item" onclick="curPage=\'guild-settlement\';openGroup=\'finance\';renderTree();renderContent()"><div class="label">工会结算申请</div><div class="value" style="color:var(--warning);">2</div><div class="sub">¥13,510 待打款 →</div></div><div class="stat-item" onclick="curPage=\'withdraw-audit\';openGroup=\'finance\';renderTree();renderContent()"><div class="label">提现申请</div><div class="value" style="color:var(--danger);">3</div><div class="sub">¥8,500 待审核 →</div></div><div class="stat-item"><div class="label">本月已结算</div><div class="value" style="color:var(--success);">¥68,500</div><div class="sub">打手 ¥38,200 · 工会 ¥24,300 · 客服 ¥6,000</div></div><div class="stat-item"><div class="label">本月平台收入</div><div class="value">¥98,200</div><div class="sub" style="color:var(--success);">利润率 30.2%</div></div></div><div style="margin-top:16px;"><div class="ant-card"><div class="ant-card-head">⚡ 快捷操作</div><div class="ant-card-body"><div style="display:flex;gap:16px;flex-wrap:wrap;"><div class="stat-item" onclick="curPage=\'guild-settlement\';openGroup=\'finance\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--warning);"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">🏛️</div><div><div style="font-weight:500;">工会结算处理</div><div style="font-size:var(--font-size-sm);color:var(--warning);">2 笔 ¥13,510</div></div></div><div class="stat-item" onclick="curPage=\'withdraw-audit\';openGroup=\'finance\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--danger);"><div style="width:40px;height:40px;background:var(--danger-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">💳</div><div><div style="font-weight:500;">提现审核处理</div><div style="font-size:var(--font-size-sm);color:var(--danger);">3 笔 ¥8,500</div></div></div></div></div></div></div>';
  }
  // ── 工会管理员 / 工会运营：录入 + 验收 + 结算 ──
  if(r==='guild_admin'||r==='guild_operator'){
    return '<div class="stat-row"><div class="stat-item" onclick="curPage=\'order-entry\';openGroup=\'order\';renderTree();renderContent()"><div class="label">今日录入订单</div><div class="value">6</div><div class="sub" style="color:var(--success);">↑ 2 单 较昨日</div></div><div class="stat-item" onclick="curPage=\'order-mgmt\';openGroup=\'order\';renderTree();renderContent()"><div class="label">工会执行中订单</div><div class="value" style="color:var(--primary);">18</div><div class="sub">待验收 5 单 →</div></div><div class="stat-item"><div class="label">工会本月流水</div><div class="value">¥32,500</div><div class="sub">待结算 ¥8,750</div></div><div class="stat-item" onclick="curPage=\'my-assets\';openGroup=\'workspace\';renderTree();renderContent()"><div class="label">工会账户余额</div><div class="value" style="color:var(--success);">¥24,880</div><div class="sub">可结算 ¥8,750 →</div></div></div><div style="margin-top:16px;"><div class="ant-card"><div class="ant-card-head">⚡ 快捷操作</div><div class="ant-card-body"><div style="display:flex;gap:16px;flex-wrap:wrap;"><div class="stat-item" onclick="curPage=\'order-entry\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">➕</div><div><div style="font-weight:500;">录入订单</div><div style="font-size:var(--font-size-sm);color:var(--text-secondary);">为本工会录入订单</div></div></div><div class="stat-item" onclick="curPage=\'order-mgmt\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--warning);"><div style="width:40px;height:40px;background:var(--warning-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">✅</div><div><div style="font-weight:500;">订单验收</div><div style="font-size:var(--font-size-sm);color:var(--warning);">5 单待验收</div></div></div><div class="stat-item" onclick="curPage=\'my-assets\';openGroup=\'workspace\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--success);"><div style="width:40px;height:40px;background:var(--success-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">💵</div><div><div style="font-weight:500;">工会结算</div><div style="font-size:var(--font-size-sm);color:var(--success);">¥8,750 可结算</div></div></div>'+(currentRole==='guild_admin'?'<div class="stat-item" onclick="openGuildSettle()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--primary);"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">💰</div><div><div style="font-weight:500;">发起结算</div><div style="font-size:var(--font-size-sm);color:var(--primary);">填写打款信息</div></div></div>':'')+'</div></div></div></div>';
  }
  // ── 代练：个人接单/提现 ──
  if(r==='booster'){
    return '<div class="stat-row"><div class="stat-item" onclick="curPage=\'order-pool\';openGroup=\'order\';renderTree();renderContent()"><div class="label">可接订单</div><div class="value" style="color:var(--primary);">8</div><div class="sub">订单池有单可抢 →</div></div><div class="stat-item"><div class="label">执行中订单</div><div class="value" style="color:var(--warning);">3</div><div class="sub">待提交交付 1 单</div></div><div class="stat-item" onclick="curPage=\'my-assets\';openGroup=\'workspace\';renderTree();renderContent()"><div class="label">本月收入</div><div class="value" style="color:var(--success);">¥4,800</div><div class="sub">可提现 ¥2,500 →</div></div><div class="stat-item"><div class="label">好评率</div><div class="value">98.5%</div><div class="sub" style="color:var(--success);">↑ 0.3%</div></div></div><div style="margin-top:16px;"><div class="ant-card"><div class="ant-card-head">⚡ 快捷操作</div><div class="ant-card-body"><div style="display:flex;gap:16px;flex-wrap:wrap;"><div class="stat-item" onclick="curPage=\'order-pool\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--primary);"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">📦</div><div><div style="font-weight:500;">接单大厅</div><div style="font-size:var(--font-size-sm);color:var(--primary);">8 单可抢</div></div></div><div class="stat-item" onclick="curPage=\'my-assets\';openGroup=\'workspace\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--warning);"><div style="width:40px;height:40px;background:var(--warning-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">💳</div><div><div style="font-weight:500;">提现</div><div style="font-size:var(--font-size-sm);color:var(--warning);">可提现 ¥2,500</div></div></div></div></div></div></div>';
  }
  return '';
}

// ── 结算/提现弹窗（全局） ──
function openGuildSettle(){
  var body='<div class="ant-form-item"><div class="ant-form-label">工会名称</div><input class="ant-input" value="三角洲工会A组" readonly style="background:var(--bg);"></div>'+
    '<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>收款银行</div><select class="ant-input"><option value="">请选择开户银行</option><option>中国工商银行</option><option>中国建设银行</option><option>中国农业银行</option><option>中国银行</option><option>招商银行</option><option>交通银行</option><option>邮储银行</option></select></div>'+
    '<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>开户行</div><input class="ant-input" placeholder="如：中国工商银行深圳南山支行"></div>'+
    '<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>收款账户名</div><input class="ant-input" placeholder="对公账户全称"></div>'+
    '<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>收款账号</div><input class="ant-input" placeholder="银行卡号"></div>'+
    '<div class="ant-form-item"><div class="ant-form-label">备注说明</div><textarea class="ant-input" style="min-height:48px;" placeholder="选填"></textarea></div>'+
    '<div style="border-top:1px solid var(--border-light);padding-top:16px;margin-top:8px;display:flex;align-items:center;justify-content:space-between;">'+
      '<span style="color:var(--text-secondary);">结算金额</span>'+
      '<span style="font-size:24px;font-weight:700;color:var(--primary);">¥8,750.00</span>'+
    '</div>';
  openModal('🏛️ 工会结算申请',body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="toast(\'结算申请已提交，等待平台审核\');closeModal()">提交申请</button>');
}
function openBoosterWithdraw(){
  var body='<div class="ant-form-item"><div class="ant-form-label">可提现余额</div><input class="ant-input" value="¥2,500.00" readonly style="background:var(--bg);font-size:18px;font-weight:600;color:var(--primary);"></div>'+
    '<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>提现金额</div><input class="ant-input" placeholder="请输入提现金额" type="number"></div>'+
    '<div style="margin:16px 0;border-top:1px solid var(--border-light);"></div>'+
    '<div style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-bottom:12px;">收款账户（来自个人中心支付宝认证）</div>'+
    '<div class="bind-item" style="margin-bottom:12px;"><div class="bind-info"><div class="bind-label">真实姓名</div><div class="bind-val">'+profile.alipayName+'</div></div></div>'+
    '<div class="bind-item" style="margin-bottom:12px;"><div class="bind-info"><div class="bind-label">身份证号</div><div class="bind-val">'+profile.alipayIdCard+'</div></div></div>'+
    '<div class="bind-item" style="margin-bottom:12px;"><div class="bind-info"><div class="bind-label">支付宝账号</div><div class="bind-val">'+profile.alipayAccount+'</div></div></div>'+
    '<div class="ant-form-item"><div class="ant-form-label">备注</div><textarea class="ant-input" style="min-height:48px;" placeholder="选填"></textarea></div>'+
    '<div class="ant-alert">提现将在 1-3 个工作日内审核处理，到账支付宝账号 '+profile.alipayAccount+'。</div>';
  openModal('💳 提现申请',body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="toast(\'✓ 提现申请已提交，等待审核\');closeModal()">提交申请</button>');
}

function rMyAssets(){
  var r=currentRole,isGuild=r==='guild_admin'||r==='guild_operator',isBooster=r==='booster';
  var h='';
  // Stats row
  if(isGuild){
    h+='<div class="stat-row"><div class="stat-item"><div class="label">工会账户余额</div><div class="value" style="color:var(--primary);">¥24,880.00</div><div class="sub">可结算金额 ¥8,750.00</div></div><div class="stat-item"><div class="label">待结算金额</div><div class="value" style="color:var(--warning);">¥8,750.00</div><div class="sub">已完成订单 28 笔</div></div><div class="stat-item"><div class="label">本月流水</div><div class="value" style="color:var(--success);">¥32,500</div><div class="sub">较上月 ↑ 18%</div></div><div class="stat-item"><div class="label">累计结算</div><div class="value">¥186,200</div><div class="sub">累计完成 428 单</div></div></div>'+(currentRole==='guild_admin'?'<div style="margin-bottom:16px;"><button class="ant-btn ant-btn-primary" onclick="openGuildSettle()">🏛️ 申请工会结算</button></div>':'')+'';
  }else{
    h+='<div class="stat-row"><div class="stat-item"><div class="label">账户余额</div><div class="value" style="color:var(--primary);">¥2,500.00</div><div class="sub">可提现余额</div></div><div class="stat-item"><div class="label">冻结金额</div><div class="value" style="color:var(--warning);">¥1,280.00</div><div class="sub">执行中订单 3 笔</div></div><div class="stat-item"><div class="label">累计收益</div><div class="value" style="color:var(--success);">¥68,500</div><div class="sub">本月 ¥4,800</div></div><div class="stat-item"><div class="label">代练币</div><div class="value">350 M</div><div class="sub">1M = 100W 游戏币</div></div></div><div style="margin-bottom:16px;"><button class="ant-btn ant-btn-primary" onclick="openBoosterWithdraw()">💳 申请提现</button></div>';
  }
  // Asset flow table
  h+='<div class="ant-card"><div class="ant-card-head">💳 资产明细流水</div><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>时间</th><th>类型</th><th>关联订单</th><th>金额变动</th><th>余额</th><th>备注</th></tr></thead><tbody>';
  var flows;
  if(isGuild){
    flows=[{time:'05-26 14:30',type:'订单收入',tag:'ant-tag-primary',order:'DD202605260015',chg:'+¥298',bal:'¥24,880.00',note:'排位上分 青铜→钻石'},{time:'05-26 11:15',type:'订单收入',tag:'ant-tag-primary',order:'DD202605260013',chg:'+¥520',bal:'¥24,582.00',note:'装备刷取x3'},{time:'05-25 18:30',type:'订单收入',tag:'ant-tag-primary',order:'DD202605250010',chg:'+¥650',bal:'¥24,062.00',note:'账号练级1→30'},{time:'05-25 10:00',type:'结算打款',tag:'ant-tag-warning',order:'-',chg:'-¥12,500',bal:'¥23,412.00',note:'工会结算打款 05月批次'},{time:'05-24 15:20',type:'订单收入',tag:'ant-tag-primary',order:'DD202605240005',chg:'+¥350',bal:'¥35,912.00',note:'排位黄金→铂金'},{time:'05-24 09:00',type:'订单收入',tag:'ant-tag-primary',order:'DD202605240003',chg:'+¥800',bal:'¥35,562.00',note:'排位钻石→黑鹰'},{time:'05-23 16:00',type:'订单收入',tag:'ant-tag-primary',order:'DD202605230008',chg:'+¥300',bal:'¥34,762.00',note:'排位青铜→钻石'},{time:'05-22 12:00',type:'服务费支出',tag:'ant-tag-default',order:'-',chg:'-¥500',bal:'¥34,462.00',note:'平台服务费月结'}];
  }else{
    flows=[{time:'05-26 14:30',type:'订单收入',tag:'ant-tag-primary',order:'DD202605260015',chg:'+¥208',bal:'¥2,500.00',note:'排位上分 青铜→钻石（70%分成）'},{time:'05-26 11:15',type:'订单收入',tag:'ant-tag-primary',order:'DD202605260013',chg:'+¥364',bal:'¥2,292.00',note:'装备刷取x3（70%分成）'},{time:'05-25 18:30',type:'订单收入',tag:'ant-tag-primary',order:'DD202605250010',chg:'+¥455',bal:'¥1,928.00',note:'账号练级1→30（70%分成）'},{time:'05-25 14:00',type:'提现',tag:'ant-tag-warning',order:'-',chg:'-¥3,000',bal:'¥1,473.00',note:'提现到支付宝 138****8888'},{time:'05-24 15:20',type:'订单收入',tag:'ant-tag-primary',order:'DD202605240005',chg:'+¥245',bal:'¥4,473.00',note:'排位黄金→铂金（70%分成）'},{time:'05-23 10:00',type:'提现',tag:'ant-tag-warning',order:'-',chg:'-¥2,000',bal:'¥4,228.00',note:'提现到支付宝 138****8888'},{time:'05-22 16:00',type:'订单收入',tag:'ant-tag-primary',order:'DD202605220008',chg:'+¥210',bal:'¥6,228.00',note:'排位青铜→钻石（70%分成）'},{time:'05-20 12:00',type:'罚扣',tag:'ant-tag-danger',order:'DD202605200005',chg:'-¥100',bal:'¥6,018.00',note:'订单超时罚扣'}];
  }
  flows.forEach(function(f){
    var cls=f.chg.indexOf('+')===0?' style="color:var(--success);"':' style="color:var(--danger);"';
    h+='<tr><td>'+f.time+'</td><td><span class="ant-tag '+f.tag+'">'+f.type+'</span></td><td class="link">'+f.order+'</td><td'+cls+'>'+f.chg+'</td><td>'+f.bal+'</td><td>'+f.note+'</td></tr>';
  });
  h+='</tbody></table></div></div></div>';
  return h;
}

// ── 订单录入 ──
function rOrderEntry(){return'<div style="display:flex;gap:16px;align-items:flex-start;height:calc(100vh - 130px);"><div style="width:240px;flex-shrink:0;display:flex;flex-direction:column;gap:12px;height:100%;"><div class="ant-card" style="border:2px solid var(--primary);flex:2;display:flex;flex-direction:column;"><div class="ant-card-head" style="background:var(--primary-light);padding:8px 14px;min-height:34px;font-size:13px;">📋 订单内容自动识别</div><div class="ant-card-body" style="padding:10px;flex:1;display:flex;flex-direction:column;"><textarea class="ant-input" style="flex:1;min-height:0;resize:none;font-size:12px;" placeholder="粘贴微信/QQ聊天记录或订单文本&#10;系统自动识别关键字段&#10;&#10;例：&#10;游戏：三角洲行动 端游&#10;区服：QQ&#10;段位：青铜→钻石&#10;价格：298元"></textarea><button class="ant-btn ant-btn-primary ant-btn-sm" style="width:100%;margin-top:8px;height:28px;" onclick="toast(\'✓ 已识别订单内容\')">🔍 识别订单</button></div></div><div class="ant-card" style="flex:1;"><div class="ant-card-head" style="padding:8px 14px;min-height:34px;font-size:13px;">🖼️ 群聊截图</div><div class="ant-card-body" style="padding:10px;"><div class="upload-area" style="padding:10px;font-size:12px;min-height:60px;display:flex;align-items:center;justify-content:center;">点击或拖拽上传截图</div></div></div></div><div style="flex:1;display:flex;flex-direction:column;gap:12px;min-width:0;height:100%;overflow-y:auto;"><div class="ant-card" style="flex:1;"><div class="ant-card-head" style="padding:8px 16px;min-height:34px;font-size:13px;">📝 信息录入</div><div class="ant-card-body" style="padding:16px;"><div class="ant-row"><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>选择游戏</div><select class="ant-input"><option>三角洲行动端游</option><option>三角洲行动手游</option></select></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;">选择平台</div><select class="ant-input"><option>WeGame</option><option>Steam</option></select></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>选择区服</div><select class="ant-input"><option>QQ账号</option><option>微信账号</option></select></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;">角色名称</div><input class="ant-input" placeholder="游戏内角色名"></div></div><div class="ant-row"><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>订单类型</div><select class="ant-input"><option>代练</option><option>陪玩</option></select></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>上号方式</div><select class="ant-input"><option>扫码登录</option><option>账号密码登录</option></select></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>服务类型</div><select class="ant-input"><option>跑刀</option></select></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>服务规格</div><input class="ant-input" placeholder="代练哈夫币数量"></div></div><div class="ant-row"><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>商品标题</div><input class="ant-input" placeholder="服务类型+游戏角色名称"></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>商品信息</div><input class="ant-input" placeholder="服务类型+游戏角色名称"></div></div><div class="ant-row"><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>选择订单来源</div><select class="ant-input"><option>内部录入</option><option>上家抢单</option><option>外部抢单</option></select></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;">订单来源编号</div><input class="ant-input" placeholder="来源平台订单号"></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;">用户手机号</div><input class="ant-input" placeholder="客户手机号"></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;">订单备注</div><input class="ant-input" placeholder="备注信息"></div></div><div class="ant-row"><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>用户支付金额(元)</div><input class="ant-input" placeholder="客户实际支付" type="number"></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>订单录入金额(元)</div><input class="ant-input" placeholder="系统录入金额" type="number"></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;">预计利润(元)</div><input class="ant-input" value="自动计算" disabled style="background:#f5f5f5;"></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;">指派客服</div><select class="ant-input"><option>请选择</option><option>小李</option><option>小周</option></select></div></div><div class="ant-row"><div class="ant-form-item" style="margin-bottom:0;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>接单方式</div><select class="ant-input" id="order-dispatch" onchange="var v=this.value;document.getElementById(\'slot2\').style.display=v===\'开放接单\'?\'none\':\'\';document.getElementById(\'slot3\').style.display=v===\'指派工会\'?\'\':\'none\';document.getElementById(\'slot4\').style.display=v===\'指派工会\'?\'\':\'none\';var s2=document.getElementById(\'slot2\');if(v===\'指派打手\'){s2.querySelector(\'.ant-form-label\').innerHTML=\'<span class=req>*</span>选择打手\';s2.querySelector(\'select\').innerHTML=\'<option>请选择打手</option><option>王代练（独立·好评98.5%）</option><option>陈代练（独立·好评99.1%）</option><option>赵代练（独立·好评97.3%）</option><option>孙代练（独立·好评95.8%）</option>\';}else if(v===\'指派工会\'){s2.querySelector(\'.ant-form-label\').innerHTML=\'<span class=req>*</span>选择工会\';s2.querySelector(\'select\').innerHTML=\'<option>请选择</option><option>三角洲工会A组</option><option>三角洲工会B组</option><option>三角洲工会C组</option>\';}"><option>开放接单</option><option>指派打手</option><option>指派工会</option></select></div><div class="ant-form-item" id="slot2" style="margin-bottom:0;display:none;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>选择打手</div><select class="ant-input"><option>请选择打手</option><option>王代练（独立·好评98.5%）</option><option>陈代练（独立·好评99.1%）</option><option>赵代练（独立·好评97.3%）</option><option>孙代练（独立·好评95.8%）</option></select></div><div class="ant-form-item" id="slot3" style="margin-bottom:0;display:none;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>发布金额(元)</div><input class="ant-input" placeholder="给下家工会的价格" type="number"></div><div class="ant-form-item" id="slot4" style="margin-bottom:0;display:none;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>保证金(元)</div><input class="ant-input" placeholder="工会保证金" type="number"></div></div></div></div><div style="display:flex;justify-content:flex-end;gap:8px;"><button class="ant-btn">保存草稿</button><button class="ant-btn ant-btn-primary" onclick="toast(\'✓ 订单发布成功\');curPage=\'order-mgmt\';openGroup=\'order\';renderTree();renderContent()">📤 发布订单</button></div></div></div>';}

// ── 订单审核（新增页面） ──
function rOrderReview(){var rows=[{id:'DD202605260012',title:'排位青铜→钻石',type:'代练',game:'三角洲',zone:'QQ',amt:'¥298',src:'内部录入',op:'小周',time:'05-26 14:30',cust:'138****8888'},{id:'DD202605260008',title:'任务代打日常',type:'代练',game:'三角洲',zone:'微信',amt:'¥120',src:'上家抢单',op:'运营A',time:'05-26 12:00',cust:'137****6666'},{id:'DD202605260005',title:'账号练级1→30',type:'代练',game:'三角洲',zone:'QQ',amt:'¥650',src:'外部抢单',op:'小周',time:'05-26 10:15',cust:'136****0001'},{id:'DD202605250015',title:'装备刷取x3',type:'代练',game:'三角洲',zone:'QQ',amt:'¥520',src:'内部录入',op:'运营B',time:'05-25 16:30',cust:'135****0002'},{id:'DD202605250012',title:'排位黄金→铂金',type:'代练',game:'三角洲',zone:'微信',amt:'¥350',src:'内部录入',op:'小周',time:'05-25 14:00',cust:'134****0003'}];var h='<div class="ant-card"><div class="ant-card-head">待审核订单 <span style="font-size:var(--font-size);color:var(--danger);">（'+rows.length+'单）</span></div><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>订单编号</th><th>订单标题</th><th>订单类型</th><th>游戏</th><th>区服</th><th>金额</th><th>来源</th><th>录入人</th><th>客户电话</th><th>创建时间</th><th>操作</th></tr></thead><tbody>';rows.forEach(function(r){h+='<tr class="clickable"><td class="link">'+r.id+'</td><td>'+r.title+'</td><td>'+r.type+'</td><td>'+r.game+'</td><td>'+r.zone+'</td><td style="font-weight:500;">'+r.amt+'</td><td>'+r.src+'</td><td>'+r.op+'</td><td>'+r.cust+'</td><td>'+r.time+'</td><td><button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'✓ 审核通过\')">通过</button> <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="toast(\'已驳回\')">驳回</button> <button class="ant-btn ant-btn-sm">详情</button></td></tr>';});h+='</tbody></table></div></div></div><div class="ant-pagination"><span class="total">共 '+rows.length+' 条</span><div><span class="page-btn active">1</span></div></div>';return h;}

// ── 上传截图辅助 ──
function addUploadFile(id,max){
  var preview=document.getElementById(id+'-preview');
  var files=preview.querySelectorAll('.upload-thumb');
  if(files.length>=max){toast('最多上传'+max+'张');return;}
  var colors=['#e6f4ff','#f0f9eb','#fdf6ec','#fef0f0','#f9f0ff'];
  var c=colors[files.length%colors.length];
  var thumb=document.createElement('div');
  thumb.className='upload-thumb';
  thumb.style.cssText='width:56px;height:56px;background:'+c+';border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:20px;position:relative;flex-shrink:0;border:1px solid var(--border-light);';
  thumb.innerHTML='🗄️<div style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;background:var(--danger);color:#fff;border-radius:50%;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;line-height:1;" onclick="event.stopPropagation();this.parentNode.remove();">×</div>';
  preview.appendChild(thumb);
}
function uploadAreaHTML(id,max){
  return '<div class="upload-area" id="'+id+'-area" onclick="addUploadFile(\''+id+'\','+max+')" style="padding:12px;text-align:center;cursor:pointer;"><div style="font-size:24px;margin-bottom:4px;color:var(--text-tertiary);">+</div><div style="font-size:12px;">点击上传截图（最多'+max+'张）</div></div><div id="'+id+'-preview" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;"></div>';
}

// ── 完成订单弹窗 ──
function openCompleteOrder(oid){
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>完成情况记录</div>'+
    '<div style="display:flex;gap:24px;">'+
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;"><input type="checkbox" id="complete-type-1" checked> 按要求完成</label>'+
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;"><input type="checkbox" id="complete-type-2"> 协商后已完成</label>'+
    '</div></div>'+
    '<div class="ant-form-item"><div class="ant-form-label">群聊截图</div>'+uploadAreaHTML('complete-upload',8)+'</div>';
  openModal('✅ 完成订单 - '+oid,body,
    '<button class="ant-btn" onclick="closeModal()">取消</button>'+
    '<button class="ant-btn ant-btn-primary" onclick="var c1=document.getElementById(\'complete-type-1\').checked;var c2=document.getElementById(\'complete-type-2\').checked;if(!c1&&!c2){toast(\'请选择完成情况\');return;}closeModal();toast(\'✓ 订单已完成\')">确认完成</button>');
}

// ── 暂停订单弹窗 ──
function openPauseOrder(oid){
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>暂停原因</div>'+
    '<select class="ant-input" id="pause-reason"><option value="">请选择暂停原因</option><option>账号异常</option><option>老板撤单</option><option>代练问题</option><option>其他</option></select></div>'+
    '<div class="ant-form-item"><div class="ant-form-label">暂停凭证</div>'+uploadAreaHTML('pause-upload',8)+'</div>';
  openModal('⏸️ 暂停订单 - '+oid,body,
    '<button class="ant-btn" onclick="closeModal()">取消</button>'+
    '<button class="ant-btn ant-btn-primary" onclick="var r=document.getElementById(\'pause-reason\').value;if(!r){toast(\'请选择暂停原因\');return;}closeModal();toast(\'✓ 订单已暂停：\'+r)">确认暂停</button>');
}

// ── 取消订单弹窗（已暂停订单）──
function openCancelOrder(oid){
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>处置方案</div>'+
    '<select class="ant-input" id="cancel-disposal"><option value="">请选择处置方案</option><option>退款</option><option>取消</option><option>挂起</option><option>其他</option></select></div>'+
    '<div class="ant-form-item"><div class="ant-form-label">处置凭证</div>'+uploadAreaHTML('cancel-upload',8)+'</div>';
  openModal('❌ 取消订单 - '+oid,body,
    '<button class="ant-btn" onclick="closeModal()">取消</button>'+
    '<button class="ant-btn ant-btn-danger" onclick="var d=document.getElementById(\'cancel-disposal\').value;if(!d){toast(\'请选择处置方案\');return;}closeModal();toast(\'✓ 订单已取消，处置方案：\'+d)">确认取消</button>');
}

// ── 订单管理 ──
function rOrderMgmt(){
  var statusTabs=['全部','待审核','待指派','执行中','待验收','待结算','已暂停','已完成','已关单'];
  var orders=[
    {id:'DD202605260012',title:'排位青铜→钻石',status:'待审核',st:'ant-tag-default',prog:'-',asset:'-',booster:'-',settle:'¥298',amt:'¥298',dep:'¥0',cs:'-',src:'内部录入',studio:'-',contact:'138****8888',type:'代练',game:'三角洲',zone:'QQ',role:'玩家A',time:'05-26 14:30',guild:'-'},
    {id:'DD202605260011',title:'任务代打日常全清',status:'执行中',st:'ant-tag-primary',prog:'6/10',asset:'6M/10M',booster:'王代练',settle:'¥105',amt:'¥150',dep:'¥30',cs:'小李',src:'内部录入',studio:'-',contact:'137****6666',type:'代练',game:'三角洲',zone:'QQ',role:'玩家B',time:'05-26 13:20',guild:'三角洲工会A组'},
    {id:'DD202605260010',title:'装备刷取x3',status:'待验收',st:'ant-tag-warning',prog:'2/3',asset:'4M/5M',booster:'刘代练',settle:'¥312',amt:'¥520',dep:'¥100',cs:'小李',src:'内部录入',studio:'-',contact:'136****0001',type:'代练',game:'三角洲',zone:'QQ',role:'玩家C',time:'05-26 11:15',guild:'-'},
    {id:'DD202605260009',title:'账号练级1→30',status:'待指派',st:'ant-tag-primary',prog:'-',asset:'-',booster:'-',settle:'¥650',amt:'¥650',dep:'¥130',cs:'小周',src:'内部录入',studio:'-',contact:'135****0002',type:'代练',game:'三角洲',zone:'微信',role:'玩家D',time:'05-26 10:00',guild:'-'},
    {id:'DD202605250015',title:'排位黄金→铂金',status:'待结算',st:'ant-tag-danger',prog:'100%',asset:'5M',booster:'陈代练',settle:'¥245',amt:'¥350',dep:'¥70',cs:'小李',src:'内部录入',studio:'-',contact:'134****0003',type:'代练',game:'三角洲',zone:'QQ',role:'玩家E',time:'05-25 16:30',guild:'三角洲工会A组'},
    {id:'DD202605250010',title:'任务代打周常',status:'待审核',st:'ant-tag-default',prog:'-',asset:'-',booster:'-',settle:'¥120',amt:'¥120',dep:'¥24',cs:'小李',src:'上家抢单',studio:'上家XX',contact:'133****0004',type:'代练',game:'三角洲',zone:'QQ',role:'玩家F',time:'05-25 14:00',guild:'-'},
    {id:'DD202605240020',title:'排位钻石→黑鹰',status:'执行中',st:'ant-tag-primary',prog:'30%',asset:'2M/12M',booster:'赵代练',settle:'¥560',amt:'¥800',dep:'¥160',cs:'小周',src:'上家抢单',studio:'上家XX',contact:'131****0005',type:'代练',game:'三角洲',zone:'QQ',role:'玩家G',time:'05-24 09:00',guild:'三角洲工会B组'},
    {id:'DD202605240015',title:'装备刷取全套',status:'已关单',st:'ant-tag-default',prog:'-',asset:'-',booster:'-',settle:'-',amt:'¥1,200',dep:'¥0',cs:'小周',src:'外部抢单',studio:'外部',contact:'139****0006',type:'代练',game:'三角洲',zone:'微信',role:'玩家H',time:'05-24 08:00',guild:'-'},
    {id:'DD202605230008',title:'排位青铜→钻石',status:'执行中',st:'ant-tag-primary',prog:'80%',asset:'12M/15M',booster:'刘代练',settle:'¥210',amt:'¥300',dep:'¥60',cs:'小李',src:'外部抢单',studio:'外部',contact:'137****0007',type:'代练',game:'三角洲',zone:'QQ',role:'玩家I',time:'05-23 16:00',guild:'-'},
    {id:'DD202605220005',title:'账号练级10→50',status:'已完成',st:'ant-tag-success',prog:'100%',asset:'50M',booster:'孙代练',settle:'¥686',amt:'¥980',dep:'¥196',cs:'小李',src:'上家抢单',studio:'上家YY',contact:'136****0008',type:'代练',game:'三角洲',zone:'QQ',role:'玩家J',time:'05-22 08:30',guild:'三角洲工会B组'},
    {id:'DD202605200003',title:'排位白银→黄金',status:'已暂停',st:'ant-tag-danger',prog:'45%',asset:'3M/7M',booster:'赵代练',settle:'-',amt:'¥180',dep:'¥36',cs:'小周',src:'内部录入',studio:'-',contact:'132****0009',type:'代练',game:'三角洲',zone:'微信',role:'玩家K',time:'05-20 15:00',guild:'-'}
  ];
  var filtered=curTab==='全部'?orders:orders.filter(function(r){return r.status===curTab;});
  // Count per tab
  function cnt(s){return s==='全部'?orders.length:orders.filter(function(r){return r.status===s;}).length;}
  var dotTabs=['待审核','待验收','已暂停'];
  // Tab bar
  var h='<div class="ant-tabs">';
  statusTabs.forEach(function(t){
    var c=cnt(t),showDot=dotTabs.indexOf(t)>=0&&c>0;
    h+='<div class="ant-tab'+(t===curTab?' active':'')+'" onclick="curTab=\''+t+'\';renderContent()">'+(showDot?'<span class="tab-dot"></span>':'')+t+' ('+c+')</div>';
  });
  h+='</div>';
  // Collapsible filter
  h+='<div style="margin-bottom:16px;"><span class="filter-toggle" id="filter-toggle" onclick="var p=document.getElementById(\'filter-panel\');var t=document.getElementById(\'filter-toggle\');if(p.classList.contains(\'show\')){p.classList.remove(\'show\');t.innerHTML=\'▼ 展开筛选\';}else{p.classList.add(\'show\');t.innerHTML=\'▲ 收起筛选\';}">▼ 展开筛选</span></div>';
  h+='<div class="filter-panel" id="filter-panel"><div class="ant-row"><div class="ant-form-item" style="margin-bottom:0;"><div class="ant-form-label" style="margin-bottom:4px;">创建时间</div><div style="display:flex;gap:8px;"><input class="ant-input" style="width:120px;" placeholder="开始日期"><span style="line-height:32px;">-</span><input class="ant-input" style="width:120px;" placeholder="结束日期"></div></div><div class="ant-form-item" style="margin-bottom:0;"><div class="ant-form-label" style="margin-bottom:4px;">订单编号</div><input class="ant-input" placeholder="订单编号"></div><div class="ant-form-item" style="margin-bottom:0;"><div class="ant-form-label" style="margin-bottom:4px;">订单类型</div><select class="ant-input"><option>全部</option><option>代练</option><option>陪玩</option></select></div></div><div class="ant-row" style="margin-top:12px;"><div class="ant-form-item" style="margin-bottom:0;"><div class="ant-form-label" style="margin-bottom:4px;">当前工会</div><select class="ant-input"><option>全部</option><option>三角洲工会A组</option><option>三角洲工会B组</option></select></div><div class="ant-form-item" style="margin-bottom:0;"><div class="ant-form-label" style="margin-bottom:4px;">当前打手</div><select class="ant-input"><option>全部</option><option>王代练</option><option>刘代练</option><option>陈代练</option><option>赵代练</option><option>孙代练</option></select></div><div class="ant-form-item" style="margin-bottom:0;"><div class="ant-form-label" style="margin-bottom:4px;">当前客服</div><select class="ant-input"><option>全部</option><option>小李</option><option>小周</option></select></div></div><div style="display:flex;gap:8px;margin-top:12px;"><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">重置</button></div></div>';
  // Table
  h+='<div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th class="sticky-col">操作</th><th>订单编号</th><th>订单标题</th><th>订单状态</th><th>当前打手</th><th>所属工会</th><th>创建时间</th><th>价格</th><th>结算</th><th>客服</th><th>来源</th><th>联系方式</th><th>类型</th><th>游戏</th><th>区服</th><th>角色</th></tr></thead><tbody>';
  filtered.forEach(function(r){
    var ops='';
    var baseOps='<button class="ant-btn ant-btn-sm" onclick="showOrderDetail(\''+r.id+'\')">查看详情</button>';
    if(r.status==='待审核'){var pb1=(currentRole==='operator'||currentRole==='guild_admin')?' <button class="ant-btn ant-btn-sm" onclick="openPauseOrder(\''+r.id+'\')">暂停</button>':'';ops=baseOps+' <button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'✓ 审核通过\')">通过</button> <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="toast(\'已驳回\')">驳回</button>'+pb1;}
    else if(r.status==='待指派'){var pb2=(currentRole==='operator'||currentRole==='guild_admin')?' <button class="ant-btn ant-btn-sm" onclick="openPauseOrder(\''+r.id+'\')">暂停</button>':'';ops=baseOps+' <button class="ant-btn ant-btn-primary ant-btn-sm" onclick="toast(\'✓ 已指派\')">指派</button>'+pb2;}
    else if(r.status==='执行中'){var adminOps='';if(currentRole==='operator'||currentRole==='guild_admin'){adminOps=' <button class="ant-btn ant-btn-success ant-btn-sm" onclick="openCompleteOrder(\''+r.id+'\')">完成</button> <button class="ant-btn ant-btn-sm" onclick="openPauseOrder(\''+r.id+'\')">暂停</button>';}else{adminOps=' <button class="ant-btn ant-btn-sm" onclick="toast(\'已暂停\')">暂停</button>';}ops=baseOps+adminOps;}
    else if(r.status==='待验收'){var pb3=(currentRole==='operator'||currentRole==='guild_admin')?' <button class="ant-btn ant-btn-sm" onclick="openPauseOrder(\''+r.id+'\')">暂停</button>':'';ops=baseOps+' <button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'✓ 验收通过\')">验收</button> <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="toast(\'已退回\')">退回</button>'+pb3;}
    else if(r.status==='待结算'){var pb4=(currentRole==='operator'||currentRole==='guild_admin')?' <button class="ant-btn ant-btn-sm" onclick="openPauseOrder(\''+r.id+'\')">暂停</button>':'';ops=baseOps+' <button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'✓ 确认结算\')">结算</button>'+pb4;}
    else if(r.status==='已暂停'){var po=' <button class="ant-btn ant-btn-sm" onclick="toast(\'✓ 订单已恢复\')">恢复订单</button>';if(currentRole==='operator'||currentRole==='guild_admin'){po+=' <button class="ant-btn ant-btn-sm" onclick="toast(\'✓ 更换打手成功\')">更换打手</button>';}po+=' <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="openCancelOrder(\''+r.id+'\')">取消订单</button>';ops=baseOps+po;}
    else if(r.status==='已完成') ops=baseOps+' <span style="color:var(--text-secondary);">已完结</span>';
    else if(r.status==='已关单') ops=baseOps+' <span style="color:var(--text-secondary);">已关闭</span>';
    h+='<tr class="clickable"><td class="sticky-col" style="white-space:nowrap;">'+ops+'</td><td class="link">'+r.id+'</td><td>'+r.title+'</td><td><span class="ant-tag '+r.st+'">'+r.status+'</span></td><td>'+r.booster+'</td><td>'+(r.guild==='-'?'-':'<span class="ant-tag ant-tag-purple">'+r.guild+'</span>')+'</td><td>'+r.time+'</td><td>'+r.amt+'</td><td>'+r.settle+'</td><td>'+r.cs+'</td><td>'+r.src+'</td><td>'+r.contact+'</td><td>'+r.type+'</td><td>'+r.game+'</td><td>'+r.zone+'</td><td>'+r.role+'</td></tr>';
  });
  h+='</tbody></table></div></div></div><div class="ant-pagination"><span class="total">共 '+filtered.length+' 条</span><div><span class="page-btn active">1</span><span class="page-btn">2</span></div></div>';
  return h;
}

// ── 订单池 ──
function doGrab(rid,rtitle,ramt){
  var isBooster=currentRole==='booster';
  var confirmBody='<div style="text-align:center;padding:8px 0;"><div style="font-size:16px;font-weight:600;margin-bottom:12px;">确认抢单</div><div class="ant-card" style="background:var(--bg);"><div class="ant-card-body" style="padding:16px;"><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:var(--text-secondary);">订单编号</span><span style="font-weight:500;">'+rid+'</span></div><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:var(--text-secondary);">订单标题</span><span>'+rtitle+'</span></div><div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">订单金额</span><span style="font-weight:600;">'+ramt+'</span></div></div></div></div>';
  if(isBooster){
    openModal('📦 抢单确认',confirmBody,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="closeModal();grabCounter++;if(grabCounter%2===1){toast(\'✓ 抢单成功，订单已进入我的订单\')}else{toast(\'⚠ 该订单已被其他用户抢单，请刷新页面\',\'已被其他用户抢单\')}">确认抢单</button>');
  }else{
    confirmBody+='<div style="margin-top:12px;"><div class="ant-form-label"><span class="req">*</span>分配打手</div><select class="ant-input" id="grab-assign-booster"><option>请选择打手</option><option>王代练（独立·好评98.5%）</option><option>陈代练（独立·好评99.1%）</option><option>赵代练（独立·好评97.3%）</option><option>孙代练（独立·好评95.8%）</option></select></div>';
    openModal('📦 抢单并分配',confirmBody,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="var b=document.getElementById(\'grab-assign-booster\').value;closeModal();if(b===\'请选择打手\'){toast(\'请先选择打手\');return;}grabCounter++;if(grabCounter%2===1){toast(\'✓ 抢单成功，已分配给 \'+b)}else{toast(\'⚠ 该订单已被其他用户抢单，请刷新页面\',\'已被其他用户抢单\')}">确认抢单并分配</button>');
  }
}

function rOrderPool(){
  var rows=[{id:'EXT-20260526001',title:'三角洲排位黄金→钻石',info:'排位上分',amt:'¥350',game:'三角洲',zone:'QQ',dur:'168h',time:'5分钟前',dep:'¥50',contact:'133****1111'},{id:'EXT-20260526002',title:'三角洲装备刷取x3',info:'装备刷取',amt:'¥520',game:'三角洲',zone:'微信',dur:'72h',time:'12分钟前',dep:'¥80',contact:'138****2222'},{id:'EXT-20260526003',title:'三角洲账号练级1→30',info:'账号练级',amt:'¥650',game:'三角洲',zone:'QQ',dur:'240h',time:'25分钟前',dep:'¥100',contact:'137****3333'},{id:'EXT-20260525004',title:'三角洲排位上分铂金→钻石',info:'排位上分',amt:'¥420',game:'三角洲',zone:'QQ',dur:'120h',time:'1小时前',dep:'¥60',contact:'135****4444'},{id:'EXT-20260525005',title:'三角洲任务代打周常全清',info:'任务代打',amt:'¥200',game:'三角洲',zone:'微信',dur:'48h',time:'2小时前',dep:'¥30',contact:'136****5555'},{id:'EXT-20260524006',title:'三角洲排位钻石→黑鹰',info:'排位上分',amt:'¥800',game:'三角洲',zone:'QQ',dur:'336h',time:'3小时前',dep:'¥150',contact:'139****6666'},{id:'EXT-20260524007',title:'三角洲装备刷取全套',info:'装备刷取',amt:'¥1,200',game:'三角洲',zone:'QQ',dur:'168h',time:'5小时前',dep:'¥200',contact:'132****7777'},{id:'EXT-20260523008',title:'三角洲账号练级10→50',info:'账号练级',amt:'¥980',game:'三角洲',zone:'微信',dur:'480h',time:'1天前',dep:'¥180',contact:'131****8888'}];
  var h='<div class="filter-bar"><input class="ant-input" style="width:130px;" placeholder="游戏名称"><input class="ant-input" style="width:120px;" placeholder="游戏区服"><input class="ant-input" style="width:140px;" placeholder="订单编号"><select class="ant-input" style="width:100px;"><option>订单类型</option><option>代练</option><option>陪玩</option></select><select class="ant-input" style="width:100px;"><option>排序</option><option>最新发布</option><option>金额最高</option></select><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">重置</button></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>订单编号</th><th>订单标题</th><th>商品信息</th><th>订单金额</th><th>游戏</th><th>区服</th><th>时长要求</th><th>发布时间</th><th>用户联系方式</th><th>操作</th></tr></thead><tbody>';
  rows.forEach(function(r){
    h+='<tr class="clickable"><td class="link">'+r.id+'</td><td>'+r.title+'</td><td>'+r.info+'</td><td style="font-weight:500;">'+r.amt+'</td><td>'+r.game+'</td><td>'+r.zone+'</td><td>'+r.dur+'</td><td>'+r.time+'</td><td>'+r.contact+'</td><td><button class="ant-btn ant-btn-primary ant-btn-sm" onclick="doGrab(\''+r.id+'\',\''+r.title+'\',\''+r.amt+'\')">抢单</button></td></tr>';
  });
  h+='</tbody></table></div></div></div><div class="ant-pagination"><span class="total">共 '+rows.length+' 条</span><div><span class="page-btn active">1</span></div></div>';
  return h;
}

// ── 数据概览 ──
function rDataOverview(){
  var r=currentRole;
  var isGuild=r==='guild_admin'||r==='guild_operator';
  var isBooster=r==='booster';
  var cd=isBooster?[
    {date:'05-20',done:1,rev:280,ast:8},
    {date:'05-21',done:2,rev:420,ast:5},
    {date:'05-22',done:0,rev:0,ast:0},
    {date:'05-23',done:1,rev:350,ast:6},
    {date:'05-24',done:3,rev:680,ast:12},
    {date:'05-25',done:2,rev:500,ast:10},
    {date:'05-26',done:1,rev:300,ast:7}
  ]:isGuild?[
    {date:'05-20',done:2,rev:620,ast:18},
    {date:'05-21',done:4,rev:980,ast:10},
    {date:'05-22',done:1,rev:350,ast:22},
    {date:'05-23',done:3,rev:1100,ast:12},
    {date:'05-24',done:2,rev:580,ast:20},
    {date:'05-25',done:5,rev:1200,ast:8},
    {date:'05-26',done:3,rev:900,ast:16}
  ]:[
    {date:'05-20',done:5,rev:1800,ast:48},
    {date:'05-21',done:11,rev:2400,ast:22},
    {date:'05-22',done:4,rev:1500,ast:52},
    {date:'05-23',done:9,rev:3300,ast:28},
    {date:'05-24',done:6,rev:2000,ast:45},
    {date:'05-25',done:12,rev:2800,ast:18},
    {date:'05-26',done:7,rev:3100,ast:38}
  ];
  var n=cd.length,CH=220,CW=590,L=50,R=82,T=10,B=28,W=CW+L+R,H=CH+T+B;
  var maxA=55,maxR=3500,barMax=12;
  var padX=CW/n;
  var xStep=(CW-2*padX)/(n-1);
  function px(i){return L+Math.round(padX+i*xStep);}
  function pyA(v){return T+CH-Math.round(v/maxA*CH);}
  function pyR(v){return T+CH-Math.round(v/maxR*CH);}
  // Grid + axis labels
  var grid='',leftAxis='',rightAxis='';
  for(var i=0;i<=5;i++){
    var y=T+Math.round(CH/5*i);
    grid+='<line x1="'+L+'" y1="'+y+'" x2="'+(L+CW)+'" y2="'+y+'" stroke="#f0f0f0" stroke-width="1"/>';
    leftAxis+='<text x="'+(L-6)+'" y="'+(y+4)+'" text-anchor="end" font-size="10" fill="var(--text-secondary)">'+Math.round(maxA/5*(5-i))+'</text>';
    rightAxis+='<text x="'+(L+CW+6)+'" y="'+(y+4)+'" text-anchor="start" font-size="10" fill="var(--text-secondary)">'+(maxR/5*(5-i))+'</text>';
  }
  // Bars (orders, no axis, values on top, bottom aligned)
  var bars='';
  cd.forEach(function(d,i){
    var bw=24,bx=px(i)-bw/2,bh=Math.round(d.done/barMax*CH),by=T+CH-bh;
    bars+='<rect x="'+bx+'" y="'+by+'" width="'+bw+'" height="'+bh+'" fill="var(--primary)" opacity=".85" rx="3"><title>'+d.date+' 完成'+d.done+'单</title></rect>';
    bars+='<text x="'+(bx+bw/2)+'" y="'+(by-5)+'" text-anchor="middle" font-size="11" font-weight="600" fill="var(--primary)">'+d.done+'</text>';
  });
  // Revenue line (right axis ¥)
  var revPath=cd.map(function(d,i){return (i===0?'M':'L')+px(i)+' '+pyR(d.rev);}).join(' ');
  var revDots=cd.map(function(d,i){return '<circle cx="'+px(i)+'" cy="'+pyR(d.rev)+'" r="4" fill="#fff" stroke="var(--success)" stroke-width="2"><title>¥'+d.rev.toLocaleString()+'</title></circle>';}).join('');
  // Asset line (left axis M)
  var astPath=cd.map(function(d,i){return (i===0?'M':'L')+px(i)+' '+pyA(d.ast);}).join(' ');
  var astDots=cd.map(function(d,i){return '<circle cx="'+px(i)+'" cy="'+pyA(d.ast)+'" r="4" fill="#fff" stroke="var(--warning)" stroke-width="2"><title>'+d.ast+'M</title></circle>';}).join('');
  // X labels
  var xLabels=cd.map(function(d,i){return '<text x="'+px(i)+'" y="'+(T+CH+18)+'" text-anchor="middle" font-size="11" fill="var(--text-secondary)">'+d.date+'</text>';}).join('');
  // Legend
  var legend='<div style="display:flex;justify-content:center;gap:20px;margin-top:8px;font-size:12px;"><span>█ 完成订单（柱顶数值）</span><span style="color:var(--warning);">--- 完成资产（左轴·M）</span><span style="color:var(--success);">—— 完成流水（右轴·¥）</span></div>';
  // SVG
  var svg='<svg width="'+W+'" height="'+H+'" style="display:block;margin:0 auto;">'+grid+leftAxis+rightAxis+'<text x="'+(L-6)+'" y="'+(T-6)+'" text-anchor="end" font-size="10" fill="var(--warning)" font-weight="600">M资产</text><text x="'+(L+CW+6)+'" y="'+(T-6)+'" text-anchor="start" font-size="10" fill="var(--success)" font-weight="600">¥流水</text>'+bars+'<path d="'+astPath+'" fill="none" stroke="var(--warning)" stroke-width="2" stroke-linejoin="round" stroke-dasharray="6,3"/>'+astDots+'<path d="'+revPath+'" fill="none" stroke="var(--success)" stroke-width="2" stroke-linejoin="round"/>'+revDots+xLabels+'</svg>';
  // Order report tabs (replaces detail table)
  var dailyRows=[{date:'05-26',cnt:28,amt:'¥8,920',done:8,doneAmt:'¥2,300'},{date:'05-25',cnt:20,amt:'¥5,800',done:6,doneAmt:'¥1,800'},{date:'05-24',cnt:26,amt:'¥8,500',done:10,doneAmt:'¥3,200'},{date:'05-23',cnt:22,amt:'¥6,900',done:8,doneAmt:'¥2,500'},{date:'05-22',cnt:24,amt:'¥7,800',done:9,doneAmt:'¥2,900'},{date:'05-21',cnt:18,amt:'¥5,100',done:5,doneAmt:'¥1,500'},{date:'05-20',cnt:21,amt:'¥6,200',done:7,doneAmt:'¥2,100'}];
  var rankRows=[{rank:1,booster:'王代练',done:12,amt:'¥4,800'},{rank:2,booster:'刘代练',done:10,amt:'¥3,900'},{rank:3,booster:'陈代练',done:8,amt:'¥3,200'},{rank:4,booster:'赵代练',done:7,amt:'¥2,800'},{rank:5,booster:'孙代练',done:5,amt:'¥1,900'}];
  var reportH='<div class="ant-card"><div class="ant-card-head">📋 订单报表</div><div class="ant-card-body"><div class="filter-bar"><input class="ant-input" style="width:120px;" placeholder="开始日期"> <span style="line-height:32px;">-</span> <input class="ant-input" style="width:120px;" placeholder="结束日期"><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">导出汇总</button><button class="ant-btn ant-btn-sm">导出按日明细</button></div><div class="ant-tabs"><div class="ant-tab'+(curSubTab==='按日统计'?' active':'')+'" onclick="curSubTab=\'按日统计\';renderContent()">按日统计</div><div class="ant-tab'+(curSubTab==='打手排行榜'?' active':'')+'" onclick="curSubTab=\'打手排行榜\';renderContent()">打手排行榜</div></div>';
  if(curSubTab==='按日统计'){
    reportH+='<div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>日期</th><th>订单数量</th><th>订单总金额</th><th>完成订单数</th><th>完成金额</th></tr></thead><tbody>';
    dailyRows.forEach(function(r){reportH+='<tr><td style="font-weight:500;">'+r.date+'</td><td>'+r.cnt+'</td><td>'+r.amt+'</td><td>'+r.done+'</td><td>'+r.doneAmt+'</td></tr>';});
    reportH+='</tbody></table></div>';
  }else{
    reportH+='<div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>排名</th><th>打手</th><th>完成订单数</th><th>完成金额</th></tr></thead><tbody>';
    rankRows.forEach(function(r){var medal=r.rank===1?'🥇':r.rank===2?'🥈':r.rank===3?'🥉':'';reportH+='<tr><td>'+medal+' '+r.rank+'</td><td style="font-weight:500;">'+r.booster+'</td><td>'+r.done+'</td><td>'+r.amt+'</td></tr>';});
    reportH+='</tbody></table></div>';
  }
  reportH+='</div></div>';
  return ''+(isGuild?'<div class="stat-row"><div class="stat-item"><div class="label">今日工会订单</div><div class="value">18</div><div class="sub">当前执行中的工会订单</div></div><div class="stat-item"><div class="label">今日工会完成</div><div class="value" style="color:var(--success);">3</div><div class="sub">今日结束的工会订单</div></div><div class="stat-item"><div class="label">今日工会录入</div><div class="value" style="color:var(--primary);">4</div><div class="sub">今天新录入的工会订单</div></div><div class="stat-item"><div class="label">工会总订单</div><div class="value" style="color:var(--warning);">22</div><div class="sub">执行中 + 待指派</div></div></div><div class="stat-row"><div class="stat-item"><div class="label">本月工会订单</div><div class="value">186</div><div class="sub" style="color:var(--success);">较上月 ↑ 8%</div></div><div class="stat-item"><div class="label">本月工会完成</div><div class="value" style="color:var(--success);">128</div><div class="sub">完成率 68.8%</div></div><div class="stat-item"><div class="label">本月工会录入</div><div class="value" style="color:var(--primary);">198</div><div class="sub">日均 7.6 单</div></div><div class="stat-item"><div class="label">本月工会流水</div><div class="value">¥52,600</div><div class="sub" style="color:var(--success);">较上月 ↑ 15%</div></div></div>':'<div class="stat-row"><div class="stat-item"><div class="label">今日订单总数</div><div class="value">45</div><div class="sub">当前正在执行中的订单</div></div><div class="stat-item"><div class="label">今日完成订单</div><div class="value" style="color:var(--success);">8</div><div class="sub">今日结束的订单</div></div><div class="stat-item"><div class="label">今日录入订单</div><div class="value" style="color:var(--primary);">12</div><div class="sub">今天新录入的订单</div></div><div class="stat-item"><div class="label">当前总订单</div><div class="value" style="color:var(--warning);">53</div><div class="sub">执行中 + 待指派</div></div></div><div class="stat-row"><div class="stat-item"><div class="label">本月累计订单</div><div class="value">486</div><div class="sub" style="color:var(--success);">较上月 ↑ 12%</div></div><div class="stat-item"><div class="label">本月累计完成</div><div class="value" style="color:var(--success);">328</div><div class="sub">完成率 67.5%</div></div><div class="stat-item"><div class="label">本月累计录入</div><div class="value" style="color:var(--primary);">512</div><div class="sub">日均 19.7 单</div></div><div class="stat-item"><div class="label">本月累计流水</div><div class="value">¥152,800</div><div class="sub" style="color:var(--success);">较上月 ↑ 22%</div></div></div>')+'<div class="ant-card"><div class="ant-card-head">📈 近7日经营趋势</div><div class="ant-card-body" style="overflow-x:auto;">'+svg+legend+'</div></div>'+reportH;
}

// ── 订单报表 ──
function rOrderReport(){var dailyRows=[{date:'05-26',cnt:28,amt:'¥8,920',done:8,doneAmt:'¥2,300'},{date:'05-25',cnt:20,amt:'¥5,800',done:6,doneAmt:'¥1,800'},{date:'05-24',cnt:26,amt:'¥8,500',done:10,doneAmt:'¥3,200'},{date:'05-23',cnt:22,amt:'¥6,900',done:8,doneAmt:'¥2,500'},{date:'05-22',cnt:24,amt:'¥7,800',done:9,doneAmt:'¥2,900'},{date:'05-21',cnt:18,amt:'¥5,100',done:5,doneAmt:'¥1,500'},{date:'05-20',cnt:21,amt:'¥6,200',done:7,doneAmt:'¥2,100'}];var rankRows=[{rank:1,booster:'王代练',done:12,amt:'¥4,800'},{rank:2,booster:'刘代练',done:10,amt:'¥3,900'},{rank:3,booster:'陈代练',done:8,amt:'¥3,200'},{rank:4,booster:'赵代练',done:7,amt:'¥2,800'},{rank:5,booster:'孙代练',done:5,amt:'¥1,900'}];var h='<div class="filter-bar"><input class="ant-input" style="width:200px;" placeholder="订单时间范围"><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">导出汇总</button><button class="ant-btn ant-btn-sm">导出按日明细</button></div><div class="ant-tabs"><div class="ant-tab'+(curSubTab==='按日统计'?' active':'')+'" onclick="curSubTab=\'按日统计\';renderContent()">按日统计</div><div class="ant-tab'+(curSubTab==='打手排行榜'?' active':'')+'" onclick="curSubTab=\'打手排行榜\';renderContent()">打手排行榜</div></div>';if(curSubTab==='按日统计'){h+='<div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>日期</th><th>订单数量</th><th>订单总金额</th><th>完成订单数</th><th>完成金额</th></tr></thead><tbody>';dailyRows.forEach(function(r){h+='<tr><td style="font-weight:500;">'+r.date+'</td><td>'+r.cnt+'</td><td>'+r.amt+'</td><td>'+r.done+'</td><td>'+r.doneAmt+'</td></tr>';});h+='</tbody></table></div></div></div>';}else{h+='<div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>排名</th><th>打手</th><th>完成订单数</th><th>完成金额</th></tr></thead><tbody>';rankRows.forEach(function(r){var medal=r.rank===1?'🥇':r.rank===2?'🥈':r.rank===3?'🥉':'';h+='<tr><td>'+medal+' '+r.rank+'</td><td style="font-weight:500;">'+r.booster+'</td><td>'+r.done+'</td><td>'+r.amt+'</td></tr>';});h+='</tbody></table></div></div></div>';}return h;}

// ── 工会结算驳回（全局） ──
function rejectGuildSettle(guild,amt){
  var body='<div class="ant-form-item"><div class="ant-form-label">工会名称</div><input class="ant-input" value="'+guild+'" readonly style="background:var(--bg);"></div>'+
    '<div class="ant-form-item"><div class="ant-form-label">结算金额</div><input class="ant-input" value="'+amt+'" readonly style="background:var(--bg);"></div>'+
    '<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>驳回理由</div><textarea class="ant-input" id="rejectReason" style="min-height:80px;" placeholder="请填写驳回理由"></textarea></div>';
  openModal('驳回结算申请',body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-danger" onclick="confirmRejectSettle(\''+guild+'\')">确认驳回</button>');
}
function confirmRejectSettle(guild){
  var reason=document.getElementById('rejectReason').value;
  if(!reason){toast('请填写驳回理由');return;}
  toast('已驳回 '+guild+' 的结算申请');
  closeModal();
}

// ── 工会结算 ──
function rGuildSettlement(){
  var rows=[
    {guild:'三角洲工会A组',admin:'张会长',tel:'138****1111',amt:'¥8,750.00',period:'2026.05.01 - 2026.05.28',time:'2026-05-28 10:30',account:'中国工商银行 6212****1234 张会长',status:'待打款',st:'ant-tag-warning'},
    {guild:'三角洲工会B组',admin:'李会长',tel:'139****2222',amt:'¥4,760.00',period:'2026.05.01 - 2026.05.28',time:'2026-05-28 14:15',account:'中国建设银行 6227****5678 李会长',status:'待打款',st:'ant-tag-warning'},
    {guild:'三角洲工会C组',admin:'王会长',tel:'137****3333',amt:'¥2,730.00',period:'2026.04.25 - 2026.05.25',time:'2026-05-25 09:00',account:'招商银行 6214****9012 王会长',status:'已打款',st:'ant-tag-success'},
    {guild:'三角洲工会A组',admin:'张会长',tel:'138****1111',amt:'¥12,500.00',period:'2026.04.01 - 2026.04.28',time:'2026-04-28 16:20',account:'中国工商银行 6212****1234 张会长',status:'已打款',st:'ant-tag-success'},
    {guild:'三角洲工会B组',admin:'李会长',tel:'139****2222',amt:'¥8,200.00',period:'2026.04.01 - 2026.04.28',time:'2026-04-28 11:00',account:'中国建设银行 6227****5678 李会长',status:'已打款',st:'ant-tag-success'}
  ];
  var h='<div class="filter-bar"><select class="ant-input" style="width:120px;"><option>结算状态</option><option>待打款</option><option>已打款</option></select><input class="ant-input" style="width:160px;" placeholder="工会名称"><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">重置</button></div>';
  h+='<div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th style="width:120px;">操作</th><th>工会名称</th><th>管理员信息</th><th>结算金额</th><th>结算周期</th><th>发起时间</th><th>收款账户</th><th>结算状态</th></tr></thead><tbody>';
  rows.forEach(function(r){
    var action=r.status==='待打款'?'<div style="white-space:nowrap;"><button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'已打款 '+r.amt+' 至'+r.admin+'账户\')">确认打款</button> <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="rejectGuildSettle(\''+r.guild+'\',\''+r.amt+'\')">驳回</button></div>':'<span style="color:var(--text-secondary);">'+r.time.slice(5)+' 已打款</span>';
    h+='<tr><td>'+action+'</td><td style="font-weight:500;">'+r.guild+'</td><td>'+r.admin+'<br><span style="font-size:var(--font-size-sm);color:var(--text-secondary);">'+r.tel+'</span></td><td style="font-weight:600;">'+r.amt+'</td><td style="font-size:var(--font-size-sm);">'+r.period+'</td><td>'+r.time+'</td><td>'+r.account.replace(' ','<br><span style="font-size:var(--font-size-sm);color:var(--text-secondary);">')+'</span></td><td><span class="ant-tag '+r.st+'">'+r.status+'</span></td></tr>';
  });
  h+='</tbody></table></div></div></div>';
  h+='<div class="ant-alert">💡 工会代练结算规则：平台 → 工会统一打款 → 工会线下分发给所属代练员。独立代练由平台直接结算。</div>';
  return h;
}

// ── 打手结算 ──
function rBoosterSettlement(){var rows=[{name:'王代练',pay:'¥500',entry:'¥400',settle:'¥280',order:'DD202605260009',status:'待结算',st:'ant-tag-warning',src:'内部录入',wait:'1天',tel:'138****1234'},{name:'刘代练',pay:'¥520',entry:'¥450',settle:'¥315',order:'DD202605250015',status:'待结算',st:'ant-tag-warning',src:'外部抢单',wait:'1天',tel:'139****5678'},{name:'陈代练',pay:'¥650',entry:'¥500',settle:'¥455',order:'DD202605250010',status:'待结算',st:'ant-tag-warning',src:'内部录入',wait:'2天',tel:'137****9012'},{name:'赵代练',pay:'¥800',entry:'¥650',settle:'¥560',order:'DD202605240020',status:'已结算',st:'ant-tag-success',src:'上家抢单',wait:'-',tel:'136****3456'},{name:'孙代练',pay:'¥120',entry:'¥100',settle:'¥84',order:'DD202605240015',status:'已结算',st:'ant-tag-success',src:'外部抢单',wait:'-',tel:'135****7890'}];var h='<div class="filter-bar"><select class="ant-input" style="width:110px;"><option>结算状态</option><option>待结算</option><option>已结算</option></select><input class="ant-input" style="width:140px;" placeholder="打手名称"><input class="ant-input" style="width:160px;" placeholder="订单号"><select class="ant-input" style="width:110px;"><option>订单来源</option><option>内部录入</option><option>上家抢单</option><option>外部抢单</option></select><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">重置</button></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>打手名称</th><th>用户支付金额</th><th>订单录入金额</th><th>应结算金额</th><th>订单号</th><th>结算状态</th><th>订单来源</th><th>等待结算时长</th><th>手机号</th><th>操作</th></tr></thead><tbody>';rows.forEach(function(r){h+='<tr class="clickable"><td>'+r.name+'</td><td>'+r.pay+'</td><td>'+r.entry+'</td><td style="font-weight:600;">'+r.settle+'</td><td class="link">'+r.order+'</td><td><span class="ant-tag '+r.st+'">'+r.status+'</span></td><td>'+r.src+'</td><td>'+r.wait+'</td><td>'+r.tel+'</td><td>'+(r.status==='待结算'?'<button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'✓ 已结算\')">结算</button>':'<span style="color:var(--text-secondary);">已结算</span>')+'</td></tr>';});h+='</tbody></table></div></div></div><div style="margin-top:12px;"><button class="ant-btn ant-btn-primary" onclick="toast(\'✓ 批量结算完成\')">批量结算（3笔）</button></div>';return h;}

// ── 客服结算 ──
function rCSSettlement(){var rows=[{name:'小李',pay:'¥28,500',entry:'¥22,000',settle:'¥3,300',orders:'45单',status:'待结算',st:'ant-tag-warning'},{name:'小周',pay:'¥18,200',entry:'¥14,500',settle:'¥2,175',orders:'32单',status:'待结算',st:'ant-tag-warning'},{name:'客服A',pay:'¥12,800',entry:'¥10,000',settle:'¥1,500',orders:'20单',status:'已结算',st:'ant-tag-success'}];var h='<div class="filter-bar"><select class="ant-input" style="width:110px;"><option>结算状态</option><option>待结算</option><option>已结算</option></select><input class="ant-input" style="width:140px;" placeholder="客服名称"><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">重置</button></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>人员名称</th><th>用户支付金额</th><th>订单录入金额</th><th>应结算金额</th><th>订单数</th><th>结算状态</th><th>操作</th></tr></thead><tbody>';rows.forEach(function(r){h+='<tr class="clickable"><td>'+r.name+'</td><td>'+r.pay+'</td><td>'+r.entry+'</td><td style="font-weight:600;">'+r.settle+'</td><td>'+r.orders+'</td><td><span class="ant-tag '+r.st+'">'+r.status+'</span></td><td>'+(r.status==='待结算'?'<button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'✓ 已结算\')">结算</button>':'<span style="color:var(--text-secondary);">已结算</span>')+'</td></tr>';});h+='</tbody></table></div></div></div><div style="margin-top:12px;"><button class="ant-btn ant-btn-primary" onclick="toast(\'✓ 批量结算完成\')">批量结算（2笔）</button></div>';return h;}

// ── 提现审核 ──
function rWithdrawAudit(){var rows=[{name:'王代练',type:'独立代练',guild:'-',amt:'¥2,500',method:'微信',acct:'wang***',time:'05-26 10:30'},{name:'刘代练',type:'独立代练',guild:'-',amt:'¥3,200',method:'支付宝',acct:'liu***',time:'05-25 16:00'},{name:'陈代练',type:'独立代练',guild:'-',amt:'¥2,800',method:'银行卡',acct:'6222****1234',time:'05-24 14:00'}];var h='<div class="ant-card"><div class="ant-card-head">待审核提现 <span style="font-size:var(--font-size);color:var(--danger);">（'+rows.length+'笔）</span></div><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>申请人</th><th>代练类型</th><th>所属工会</th><th>提现金额</th><th>收款方式</th><th>收款账号</th><th>申请时间</th><th>操作</th></tr></thead><tbody>';rows.forEach(function(r){h+='<tr class="clickable"><td>'+r.name+'</td><td>'+r.type+'</td><td>'+r.guild+'</td><td style="font-weight:600;">'+r.amt+'</td><td>'+r.method+'</td><td>'+r.acct+'</td><td>'+r.time+'</td><td><button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'✓ 已打款 '+r.amt+' 至 '+r.acct+'\')">通过</button> <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="toast(\'已驳回\')">驳回</button></td></tr>';});h+='</tbody></table></div></div></div><div class="ant-alert">仅审核独立代练提现申请。工会代练由工会线下结算分发，不经过此审核流程。</div>';return h;}

// ── 机构管理 ──
var orgList=[{name:'三角洲工会A组',admin:'张会长',desc:'三角洲游戏代练工作室，专注排位上分',status:1,createdAt:'2026-03-15',createdBy:'管理员',splitMode:'固定比例',splitVal:'70%'},{name:'三角洲工会B组',admin:'李会长',desc:'三角洲游戏代练工作室，综合代练服务',status:1,createdAt:'2026-04-01',createdBy:'管理员',splitMode:'固定金额',splitVal:'¥50/单'},{name:'三角洲工会C组',admin:'-',desc:'三角洲游戏代练工作室（筹备中）',status:0,createdAt:'2026-05-10',createdBy:'运营小周',splitMode:'保底+比例',splitVal:'¥30+15%'}];
function rOrgMgmt(){
  var h='<div style="display:flex;justify-content:space-between;margin-bottom:16px;"><button class="ant-btn ant-btn-primary" onclick="openOrgEdit(true)">+ 添加机构</button><input class="ant-input" style="width:200px;" placeholder="搜索机构名称..." id="orgFilterKw" oninput="renderContent()"></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th style="width:140px;">操作</th><th>机构名称</th><th>机构管理员</th><th>机构说明</th><th>分成模式</th><th>分成数值</th><th>状态</th><th>创建时间</th></tr></thead><tbody>';
  var kwEl=document.getElementById('orgFilterKw'); var kw=kwEl?kwEl.value.toLowerCase()||'':'';
  orgList.forEach(function(o){
    if(kw&&o.name.toLowerCase().indexOf(kw)===-1) return;
    var st=o.status?'<span class="ant-tag ant-tag-success">启用</span>':'<span class="ant-tag ant-tag-default">禁用</span>';
    h+='<tr><td style="white-space:nowrap;"><button class="ant-btn ant-btn-sm" onclick="openOrgEdit(false,\''+o.name+'\')">编辑</button> <button class="ant-btn ant-btn-sm '+(o.status?'ant-btn-danger':'ant-btn-success')+'" onclick="toggleOrgStatus(\''+o.name+'\')">'+(o.status?'禁用':'启用')+'</button></td><td style="font-weight:500;">'+o.name+'</td><td>'+o.admin+'</td><td style="color:var(--text-secondary);">'+o.desc+'</td><td>'+(o.splitMode==='-'?'-':'<span class="ant-tag ant-tag-primary">'+o.splitMode+'</span>')+'</td><td>'+o.splitVal+'</td><td>'+st+'</td><td>'+o.createdAt+'</td></tr>';
  });
  h+='</tbody></table></div></div></div>';
  return h;
}
function openOrgEdit(isNew,orgName){
  var o=null;
  if(!isNew){
    o=orgList.find(function(x){return x.name===orgName;});
    if(!o) return;
  }
  var title=isNew?'添加机构':'编辑机构 - '+(o?o.name:'');
  var name=o?o.name:'',admin=o?o.admin:'',desc=o?o.desc:'',status=o?o.status:1,sm=o?o.splitMode:'',sv=o?o.splitVal:'',sv2=(o?o.splitVal2:'')||'';
  if(sm==='-'||!sm) sm='固定比例';
  var admins=userList.filter(function(u){return u.pos==='会长';});
  var adminOpt='<option value="">请选择机构管理员</option>';
  admins.forEach(function(a){adminOpt+='<option value="'+a.name+'"'+(admin===a.name?' selected':'')+'>'+a.name+'（'+a.tel+'）</option>';});
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>机构名称</div><input class="ant-input" id="oeName" value="'+name+'" placeholder="请输入机构名称"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>机构管理员</div><select class="ant-input" id="oeAdmin">'+adminOpt+'</select></div><div class="ant-form-item"><div class="ant-form-label">机构说明</div><textarea class="ant-input" id="oeDesc" placeholder="请简要描述该机构" rows="3">'+desc+'</textarea></div><div class="ant-row"><div class="ant-form-item"><div class="ant-form-label">机构资质</div><div class="upload-area" onclick="toast(\'已选择文件：营业执照.png\')">点击上传营业执照或相关资质</div></div><div class="ant-form-item"><div class="ant-form-label">合同文件</div><div class="upload-area" onclick="toast(\'已选择文件：代练合作协议.pdf\')">点击上传合作协议或合同文件</div></div></div><div class="ant-form-item"><div class="ant-form-label">状态</div><div class="radio-group"><label class="radio-item'+(status?' active':'')+'" onclick="this.parentNode.querySelectorAll(\'.radio-item\').forEach(function(el){el.classList.remove(\'active\')});this.classList.add(\'active\');document.getElementById(\'oeStatus\').value=\'1\'"><input type="radio" name="oeStatus" value="1"'+(status?' checked':'')+' style="display:none;">启用</label><label class="radio-item'+(!status?' active':'')+'" onclick="this.parentNode.querySelectorAll(\'.radio-item\').forEach(function(el){el.classList.remove(\'active\')});this.classList.add(\'active\');document.getElementById(\'oeStatus\').value=\'0\'"><input type="radio" name="oeStatus" value="0"'+(!status?' checked':'')+' style="display:none;">禁用</label></div><input type="hidden" id="oeStatus" value="'+(status?'1':'0')+'"></div><div class="ant-form-item"><div class="ant-form-label">分成模式</div>'+splitModeHTML(sm)+'</div><div class="ant-form-item"><div class="ant-form-label">数值设定</div>'+splitValHTML(sm,sv,sv2)+'</div>';
  var footer='<button class="ant-btn" onclick="closeModal()">取消</button>'+(isNew?'<button class="ant-btn ant-btn-primary" onclick="saveNewOrg()">保存</button>':'<button class="ant-btn ant-btn-primary" onclick="saveEditOrg(\''+(o?o.name:'')+'\')">保存</button>');
  openModal(title,body,footer);
}
function saveNewOrg(){
  var name=document.getElementById('oeName').value.trim();
  var admin=document.getElementById('oeAdmin').value;
  var desc=document.getElementById('oeDesc').value.trim();
  var status=document.getElementById('oeStatus').value==='1'?1:0;
  if(!name) return toast('请输入<span style="color:var(--danger);">机构名称</span>');
  if(!admin) return toast('请选择<span style="color:var(--danger);">机构管理员</span>');
  if(orgList.some(function(x){return x.name===name;})) return toast('机构 <span style="color:var(--danger);">'+name+'</span> 已存在');
  var smEl=document.querySelector('input[name="splitMode"]:checked');
  var osm=smEl?smEl.value:'固定比例';
  var osv1=document.getElementById('ueSplitV1'); var osv=osv1?osv1.value:'';
  var osv2El=document.getElementById('ueSplitV2'); var osv2=osv2El?osv2El.value:'';
  var splitVal='';
  if(osm==='固定比例') splitVal=osv+'%';
  else if(osm==='固定金额') splitVal='¥'+osv+'/单';
  else if(osm==='保底+比例') splitVal='¥'+osv+'+'+osv2+'%';
  orgList.push({name:name,admin:admin,desc:desc||'-',status:status,createdAt:new Date().toISOString().slice(0,10),createdBy:'当前用户',splitMode:osm,splitVal:splitVal});
  closeModal();
  toast('机构 <span style="color:var(--danger);">'+name+'</span> 添加成功');
  renderContent();
}
function saveEditOrg(orgName){
  var name=document.getElementById('oeName').value.trim();
  var admin=document.getElementById('oeAdmin').value;
  var desc=document.getElementById('oeDesc').value.trim();
  var status=document.getElementById('oeStatus').value==='1'?1:0;
  if(!name) return toast('请输入<span style="color:var(--danger);">机构名称</span>');
  if(!admin) return toast('请选择<span style="color:var(--danger);">机构管理员</span>');
  var o=orgList.find(function(x){return x.name===orgName;});
  if(!o) return;
  if(name!==orgName&&orgList.some(function(x){return x.name===name;})) return toast('机构 <span style="color:var(--danger);">'+name+'</span> 已存在');
  var smEl=document.querySelector('input[name="splitMode"]:checked');
  var osm=smEl?smEl.value:'固定比例';
  var osv1=document.getElementById('ueSplitV1'); var osv=osv1?osv1.value:'';
  var osv2El=document.getElementById('ueSplitV2'); var osv2=osv2El?osv2El.value:'';
  var splitVal='';
  if(osm==='固定比例') splitVal=osv+'%';
  else if(osm==='固定金额') splitVal='¥'+osv+'/单';
  else if(osm==='保底+比例') splitVal='¥'+osv+'+'+osv2+'%';
  o.name=name;o.admin=admin;o.desc=desc||'-';o.status=status;o.splitMode=osm;o.splitVal=splitVal;
  closeModal();
  toast('机构 <span style="color:var(--danger);">'+name+'</span> 信息已更新');
  renderContent();
}
function toggleOrgStatus(orgName){
  var o=orgList.find(function(x){return x.name===orgName;});
  if(!o) return;
  o.status=o.status?0:1;
  toast('机构 <span style="color:var(--danger);">'+o.name+'</span> 已'+(o.status?'启用':'禁用'));
  renderContent();
}

// ── 岗位管理 ──
var posList=[{code:'booster',name:'打手',roles:'代练',desc:'游戏代练执行人员，接单执行交付',status:1,createdBy:'管理员',createdAt:'2026-05-19'},{code:'cs',name:'客服',roles:'平台客服',desc:'订单审核验收人员，处理客诉',status:1,createdBy:'管理员',createdAt:'2026-05-19'},{code:'operator',name:'运营',roles:'平台运营',desc:'平台运营管理人员，配置系统',status:1,createdBy:'管理员',createdAt:'2026-05-19'},{code:'guild_admin',name:'会长',roles:'工会管理员',desc:'工会管理员，管理本工会人员和订单',status:1,createdBy:'管理员',createdAt:'2026-05-20'},{code:'finance',name:'财务',roles:'平台财务',desc:'提现审核、工会/代练/客服结算',status:1,createdBy:'管理员',createdAt:'2026-05-20'},{code:'guild_operator',name:'工会运营',roles:'工会运营',desc:'订单录入，管理本工会人员和订单',status:1,createdBy:'管理员',createdAt:'2026-05-20'}];
function rPositionMgmt(){
  var h='<div style="display:flex;justify-content:space-between;margin-bottom:16px;"><button class="ant-btn ant-btn-primary" onclick="openPosEdit(true)">+ 添加岗位</button><input class="ant-input" style="width:200px;" placeholder="搜索岗位名称/代码..." id="posFilterKw" oninput="renderContent()"></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th style="width:140px;">操作</th><th>岗位名称</th><th>岗位代码</th><th>岗位描述</th><th>关联角色</th><th>状态</th><th>创建时间</th><th>创建人</th></tr></thead><tbody>';
  var kwEl=document.getElementById('posFilterKw'); var kw=kwEl?kwEl.value.toLowerCase()||'':'';
  posList.forEach(function(p){
    if(kw&&p.name.toLowerCase().indexOf(kw)===-1&&p.code.toLowerCase().indexOf(kw)===-1) return;
    var st=p.status?'<span class="ant-tag ant-tag-success">启用</span>':'<span class="ant-tag ant-tag-default">禁用</span>';
    h+='<tr><td style="white-space:nowrap;"><button class="ant-btn ant-btn-sm" onclick="openPosEdit(false,\''+p.code+'\')">编辑</button> <button class="ant-btn ant-btn-sm '+(p.status?'ant-btn-danger':'ant-btn-success')+'" onclick="togglePosStatus(\''+p.code+'\')">'+(p.status?'禁用':'启用')+'</button></td><td style="font-weight:500;">'+p.name+'</td><td>'+p.code+'</td><td style="color:var(--text-secondary);">'+p.desc+'</td><td><span class="ant-tag ant-tag-primary">'+p.roles+'</span></td><td>'+st+'</td><td>'+p.createdAt+'</td><td>'+p.createdBy+'</td></tr>';
  });
  h+='</tbody></table></div></div></div>';
  return h;
}
function openPosEdit(isNew,pcode){
  var p=null;
  if(!isNew){
    p=posList.find(function(x){return x.code===pcode;});
    if(!p) return;
  }
  var title=isNew?'添加岗位':'编辑岗位 - '+(p?p.name:'');
  var name=p?p.name:'',code=p?p.code:'',desc=p?p.desc:'',roles=p?p.roles:'';
  var allRoles=['平台管理员','平台运营','平台客服','平台财务','工会管理员','工会运营','代练'];
  var selRoles=roles?roles.split('、'):[];
  var rolesCheck='';
  allRoles.forEach(function(r){
    var checked=selRoles.indexOf(r)!==-1?' checked':'';
    rolesCheck+='<label style="display:inline-flex;align-items:center;gap:4px;margin-right:16px;margin-bottom:8px;cursor:pointer;"><input type="checkbox" value="'+r+'" class="peRole"'+checked+'> '+r+'</label>';
  });
  var body='<div class="ant-row"><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>岗位名称</div><input class="ant-input" id="peName" value="'+name+'" placeholder="请输入岗位名称"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>岗位代码</div><input class="ant-input" id="peCode" value="'+code+'" placeholder="请输入岗位代码"'+(isNew?'':' readonly style="background:#f5f5f5"')+'></div></div><div class="ant-form-item"><div class="ant-form-label">关联角色</div><div style="padding:8px 0;">'+rolesCheck+'</div></div><div class="ant-form-item"><div class="ant-form-label">描述</div><textarea class="ant-input" id="peDesc" placeholder="请简要描述该岗位的职责" rows="3">'+desc+'</textarea></div>';
  var footer='<button class="ant-btn" onclick="closeModal()">取消</button>'+(isNew?'<button class="ant-btn ant-btn-primary" onclick="saveNewPos()">保存</button>':'<button class="ant-btn ant-btn-primary" onclick="saveEditPos(\''+pcode+'\')">保存</button>');
  openModal(title,body,footer);
}
function saveNewPos(){
  var name=document.getElementById('peName').value.trim();
  var code=document.getElementById('peCode').value.trim();
  var desc=document.getElementById('peDesc').value.trim();
  if(!name) return toast('请输入<span style="color:var(--danger);">岗位名称</span>');
  if(!code) return toast('请输入<span style="color:var(--danger);">岗位代码</span>');
  if(posList.some(function(x){return x.code===code;})) return toast('岗位代码 <span style="color:var(--danger);">'+code+'</span> 已存在，请更换');
  var sel=document.querySelectorAll('.peRole:checked');
  var roles=[];sel.forEach(function(cb){roles.push(cb.value);});
  posList.push({code:code,name:name,roles:roles.join('、')||'-',desc:desc||'-',status:1,createdBy:'当前用户',createdAt:new Date().toISOString().slice(0,10)});
  closeModal();
  toast('岗位 <span style="color:var(--danger);">'+name+'</span> 添加成功');
  renderContent();
}
function saveEditPos(pcode){
  var name=document.getElementById('peName').value.trim();
  var desc=document.getElementById('peDesc').value.trim();
  if(!name) return toast('请输入<span style="color:var(--danger);">岗位名称</span>');
  var p=posList.find(function(x){return x.code===pcode;});
  if(!p) return;
  var sel=document.querySelectorAll('.peRole:checked');
  var roles=[];sel.forEach(function(cb){roles.push(cb.value);});
  p.name=name;p.desc=desc||'-';p.roles=roles.join('、')||'-';
  closeModal();
  toast('岗位 <span style="color:var(--danger);">'+name+'</span> 信息已更新');
  renderContent();
}
function togglePosStatus(pcode){
  var p=posList.find(function(x){return x.code===pcode;});
  if(!p) return;
  p.status=p.status?0:1;
  toast('岗位 <span style="color:var(--danger);">'+p.name+'</span> 已'+(p.status?'启用':'禁用'));
  renderContent();
}

// ── 用户管理 ──
var userList=[{uid:'U20260527001',name:'王代练',tel:'138xxxx1234',guild:'三角洲工会A组',pos:'打手',acct:'wang_dl'},{uid:'U20260527002',name:'刘代练',tel:'139xxxx5678',guild:'三角洲工会A组',pos:'打手',acct:'liu_dl'},{uid:'U20260527003',name:'陈代练',tel:'137xxxx9012',guild:'-',pos:'打手',acct:'chen_dl'},{uid:'U20260527004',name:'赵代练',tel:'136xxxx3456',guild:'三角洲工会A组',pos:'打手',acct:'zhao_dl'},{uid:'U20260527005',name:'孙代练',tel:'135xxxx7890',guild:'三角洲工会B组',pos:'打手',acct:'sun_dl'},{uid:'U20260527006',name:'张会长',tel:'138xxxx1111',guild:'三角洲工会A组',pos:'会长',acct:'zhang_hz'},{uid:'U20260527007',name:'小李',tel:'139xxxx0001',guild:'-',pos:'客服',acct:'li_xiaomei'},{uid:'U20260527008',name:'小周',tel:'139xxxx0002',guild:'-',pos:'运营',acct:'zhou_xiao'}];
var userNextId=9;
function rUserMgmt(){
  var h='<div style="display:flex;justify-content:space-between;margin-bottom:16px;"><div style="display:flex;gap:8px;"><button class="ant-btn ant-btn-primary" onclick="openUserEdit(true)">+ 添加用户</button></div><div style="display:flex;gap:8px;"><select class="ant-input" style="width:150px;" id="uFilterOrg"><option value="">全部组织</option><option value="平台">平台</option><option value="三角洲工会A组">三角洲工会A组</option><option value="三角洲工会B组">三角洲工会B组</option></select><input class="ant-input" style="width:180px;" placeholder="搜索姓名/手机号/编号..." id="uFilterKw" oninput="renderContent()"></div></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th style="width:140px;">操作</th><th>用户编号</th><th>用户姓名</th><th>手机号</th><th>工会</th><th>岗位</th></tr></thead><tbody>';
  var orgEl=document.getElementById('uFilterOrg'); var orgVal=orgEl?orgEl.value:'';
  var kwEl=document.getElementById('uFilterKw'); var kwVal=kwEl?kwEl.value.toLowerCase()||'':'';
  userList.forEach(function(u){
    if(orgVal&&u.guild!==orgVal) return;
    if(kwVal&&u.uid.toLowerCase().indexOf(kwVal)===-1&&u.name.toLowerCase().indexOf(kwVal)===-1&&u.tel.indexOf(kwVal)===-1) return;
    var gd=u.guild==='-'?'-':'<span class="ant-tag ant-tag-purple">'+u.guild+'</span>';
    h+='<tr><td style="white-space:nowrap;"><button class="ant-btn ant-btn-sm" onclick="openUserEdit(false,\''+u.uid+'\')">编辑</button> <button class="ant-btn ant-btn-sm" onclick="openResetPwd(\''+u.uid+'\')">重置密码</button> <button class="ant-btn ant-btn-sm ant-btn-danger" onclick="deleteUser(\''+u.uid+'\')">删除</button></td><td style="font-weight:500;">'+u.uid+'</td><td>'+u.name+'</td><td>'+u.tel+'</td><td>'+gd+'</td><td>'+u.pos+'</td></tr>';
  });
  h+='</tbody></table></div></div></div>';
  return h;
}
function splitModeHTML(sel){
  var modes=['固定比例','固定金额','保底+比例'];
  var h='<div class="radio-group" id="ueSplitMode">';
  modes.forEach(function(m){
    h+='<label class="radio-item'+(m===sel?' active':'')+'" onclick="onSplitModeChange(\''+m+'\')"><input type="radio" name="splitMode" value="'+m+'"'+(m===sel?' checked':'')+' style="display:none;">'+m+'</label>';
  });
  h+='</div>';
  return h;
}
function splitValHTML(mode,val1,val2){
  var h='<div id="ueSplitValWrap">';
  if(mode==='固定比例'){
    h+='<div style="display:flex;align-items:center;gap:4px;"><input class="ant-input" id="ueSplitV1" value="'+val1+'" placeholder="比例数值" style="width:120px;"><span>%</span></div>';
  }else if(mode==='固定金额'){
    h+='<div style="display:flex;align-items:center;gap:4px;"><span>¥</span><input class="ant-input" id="ueSplitV1" value="'+val1+'" placeholder="金额数值" style="width:120px;"><span>/单</span></div>';
  }else if(mode==='保底+比例'){
    h+='<div style="display:flex;gap:8px;align-items:center;"><span>¥</span><input class="ant-input" id="ueSplitV1" value="'+val1+'" placeholder="保底金额" style="width:100px;"><span>+</span><input class="ant-input" id="ueSplitV2" value="'+val2+'" placeholder="比例" style="width:80px;"><span>%</span></div>';
  }
  h+='</div>';
  return h;
}
function onSplitModeChange(mode){
  var wrap=document.getElementById('ueSplitValWrap');
  if(!wrap) return;
  var v1='',v2='',oldMode='';
  var oldV1=document.getElementById('ueSplitV1');
  if(oldV1){v1=oldV1.value;oldMode=oldV1.getAttribute('data-mode');}
  if(oldMode!==mode){v1='';v2='';}
  document.getElementById('ueSplitValWrap').innerHTML=splitValHTML(mode,v1,v2);
  var labels=document.querySelectorAll('#ueSplitMode .radio-item');
  labels.forEach(function(l){l.classList.remove('active');});
  event.currentTarget.classList.add('active');
}
function openUserEdit(isNew,uid){
  var u=null;
  if(!isNew){
    u=userList.find(function(x){return x.uid===uid;});
    if(!u) return;
  }
  var title=isNew?'添加用户':'编辑用户 - '+uid;
  var acct=u?u.acct:'',name=u?u.name:'',tel=u?u.tel:'',guild=u?u.guild:'',pos=u?u.pos:'';
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>用户账号</div><input class="ant-input" id="ueAcct" value="'+(isNew?'':acct)+'" placeholder="请输入用户账号"></div><div class="ant-row"><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>登陆密码</div><input class="ant-input" type="password" id="uePwd" placeholder="请输入登陆密码"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>确认密码</div><input class="ant-input" type="password" id="uePwd2" placeholder="请再次输入登陆密码"></div></div><div class="ant-row"><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>用户姓名</div><input class="ant-input" id="ueName" value="'+name+'" placeholder="请输入用户姓名"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>手机号</div><input class="ant-input" id="ueTel" value="'+tel+'" placeholder="请输入手机号"></div></div><div class="ant-row"><div class="ant-form-item"><div class="ant-form-label">所属组织</div><select class="ant-input" id="ueGuild"><option value="">请选择组织</option><option value="平台"'+(guild==='平台'?' selected':'')+'>平台</option><option value="三角洲工会A组"'+(guild==='三角洲工会A组'?' selected':'')+'>三角洲工会A组</option><option value="三角洲工会B组"'+(guild==='三角洲工会B组'?' selected':'')+'>三角洲工会B组</option></select></div><div class="ant-form-item"><div class="ant-form-label">岗位</div><select class="ant-input" id="uePos"><option value="">请选择岗位</option><option value="会长"'+('会长'===pos?' selected':'')+'>会长</option><option value="运营"'+('运营'===pos?' selected':'')+'>运营</option><option value="客服"'+('客服'===pos?' selected':'')+'>客服</option><option value="打手"'+('打手'===pos?' selected':'')+'>打手</option></select></div></div>';
  var footer='<button class="ant-btn" onclick="closeModal()">取消</button>'+(isNew?'<button class="ant-btn ant-btn-primary" onclick="saveNewUser()">保存</button>':'<button class="ant-btn ant-btn-primary" onclick="saveEditUser(\''+uid+'\')">保存</button>');
  openModal(title,body,footer);
}
function saveNewUser(){
  var acct=document.getElementById('ueAcct').value.trim();
  var pwd=document.getElementById('uePwd').value;
  var pwd2=document.getElementById('uePwd2').value;
  var name=document.getElementById('ueName').value.trim();
  var tel=document.getElementById('ueTel').value.trim();
  var guild=document.getElementById('ueGuild').value;
  var pos=document.getElementById('uePos').value;
  if(!acct) return toast('请输入<span style="color:var(--danger);">用户账号</span>');
  if(!pwd) return toast('请输入<span style="color:var(--danger);">登陆密码</span>');
  if(pwd!==pwd2) return toast('两次输入的<span style="color:var(--danger);">密码不一致</span>');
  if(!name) return toast('请输入<span style="color:var(--danger);">用户姓名</span>');
  if(!tel) return toast('请输入<span style="color:var(--danger);">手机号</span>');
  var uid='U'+new Date().toISOString().slice(0,10).replace(/-/g,'')+String(userNextId).padStart(3,'0');
  userNextId++;
  userList.push({uid:uid,name:name,tel:tel,guild:guild||'-',pos:pos||'-',acct:acct});
  closeModal();
  toast('用户 <span style="color:var(--danger);">'+name+'</span> 添加成功，编号 '+uid);
  renderContent();
}
function saveEditUser(uid){
  var name=document.getElementById('ueName').value.trim();
  var tel=document.getElementById('ueTel').value.trim();
  var guild=document.getElementById('ueGuild').value;
  var pos=document.getElementById('uePos').value;
  if(!name) return toast('请输入<span style="color:var(--danger);">用户姓名</span>');
  if(!tel) return toast('请输入<span style="color:var(--danger);">手机号</span>');
  var u=userList.find(function(x){return x.uid===uid;});
  if(!u) return;
  u.name=name;u.tel=tel;u.guild=guild||'-';u.pos=pos||'-';
  closeModal();
  toast('用户 <span style="color:var(--danger);">'+name+'</span> 信息已更新');
  renderContent();
}
function openResetPwd(uid){
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>新密码</div><input class="ant-input" type="password" id="rpPwd" placeholder="请输入新密码"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>确认密码</div><input class="ant-input" type="password" id="rpPwd2" placeholder="请再次输入新密码"></div>';
  openModal('重置密码 - '+uid,body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="confirmResetPwd(\''+uid+'\')">确认重置</button>');
}
function confirmResetPwd(uid){
  var pwd=document.getElementById('rpPwd').value;
  var pwd2=document.getElementById('rpPwd2').value;
  if(!pwd) return toast('请输入<span style="color:var(--danger);">新密码</span>');
  if(pwd!==pwd2) return toast('两次输入的<span style="color:var(--danger);">密码不一致</span>');
  closeModal();
  toast('用户 <span style="color:var(--danger);">'+uid+'</span> 密码已重置');
}
function deleteUser(uid){
  var u=userList.find(function(x){return x.uid===uid;});
  if(!u) return;
  var body='<p>确认删除用户 <strong>'+u.name+'</strong>（'+uid+'）吗？此操作不可撤销。</p>';
  openModal('删除用户',body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-danger" id="confirmDelBtn" onclick="confirmDeleteUser(\''+uid+'\')">确认删除</button>');
}
function confirmDeleteUser(uid){
  userList=userList.filter(function(x){return x.uid!==uid;});
  closeModal();
  toast('用户已<span style="color:var(--danger);">删除</span>');
  renderContent();
}

// ── 打手审核 ──
function rBoosterReview(){return'<div style="position:relative;"><div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,.6);z-index:10;border-radius:var(--radius-lg);cursor:not-allowed;"></div><div class="ant-card"><div class="ant-card-head">待审核代练身份 <span style="font-size:var(--font-size);color:var(--danger);">（2人）</span></div><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>账号</th><th>昵称</th><th>手机号</th><th>申请工会</th><th>添加人</th><th>游戏特长</th><th>申请时间</th><th>操作</th></tr></thead><tbody><tr><td>new_dl_a</td><td>新代练A</td><td>136****0001</td><td><span class="ant-tag ant-tag-purple">三角洲工会A组</span></td><td>张会长</td><td>三角洲·排位上分·装备刷取</td><td>05-26 09:00</td><td><button class="ant-btn ant-btn-success ant-btn-sm">通过</button> <button class="ant-btn ant-btn-danger ant-btn-sm">驳回</button></td></tr><tr><td>new_dl_b</td><td>新代练B</td><td>137****0002</td><td>-（独立代练）</td><td>运营小周</td><td>三角洲·综合代练</td><td>05-26 10:30</td><td><button class="ant-btn ant-btn-success ant-btn-sm">通过</button> <button class="ant-btn ant-btn-danger ant-btn-sm">驳回</button></td></tr></tbody></table></div></div></div><div class="ant-alert">代练身份审核流程：工会管理员/运营添加代练 → 平台运营审核身份 → 通过后代练员可登录系统接单</div></div>';}

// ── 下家绑定 ──
function rBindSet(){return'<div style="position:relative;"><div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,.6);z-index:10;border-radius:var(--radius-lg);cursor:not-allowed;"></div><div class="filter-bar"><input class="ant-input" style="width:160px;" placeholder="下家SaaS编号"><input class="ant-input" style="width:160px;" placeholder="下家SaaS账号"><input class="ant-input" style="width:180px;" placeholder="下家系统名称"><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">重置</button><button class="ant-btn ant-btn-primary ant-btn-sm" style="margin-left:auto;">+ 绑定下家</button></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>下家SaaS编号</th><th>下家SaaS账号</th><th>下家系统名称</th><th>添加操作人</th><th>添加时间</th><th>操作</th></tr></thead><tbody><tr><td>DS-2026001</td><td>guild_a_partner</td><td>三角洲工会A组·下游</td><td>管理员</td><td>2026-03-15 09:30</td><td><button class="ant-btn ant-btn-sm">编辑</button> <button class="ant-btn ant-btn-danger ant-btn-sm">解绑</button></td></tr><tr><td>DS-2026002</td><td>guild_b_partner</td><td>三角洲工会B组·下游</td><td>管理员</td><td>2026-04-01 14:00</td><td><button class="ant-btn ant-btn-sm">编辑</button> <button class="ant-btn ant-btn-danger ant-btn-sm">解绑</button></td></tr><tr><td>DS-2026003</td><td>studio_x_partner</td><td>X电竞工作室</td><td>运营小周</td><td>2026-05-10 16:20</td><td><button class="ant-btn ant-btn-sm">编辑</button> <button class="ant-btn ant-btn-danger ant-btn-sm">解绑</button></td></tr></tbody></table></div></div></div></div>';}

// ── 游戏设置 ──
function openGameEdit(isNew){
  var title=isNew?'添加游戏':'编辑游戏';
  var nameVal=isNew?'':'三角洲行动';
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>游戏名称</div><input class="ant-input" value="'+nameVal+'" placeholder="请输入游戏名称"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>游戏图标</div><div style="display:flex;align-items:center;gap:12px;"><div style="width:64px;height:64px;background:var(--bg);border:1px dashed var(--border);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;" onclick="toast(\'上传图标\')">🎯</div><div style="font-size:12px;color:var(--text-secondary);">点击上传游戏图标<br>建议尺寸 128x128</div></div></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>支持订单类型</div><div style="display:flex;gap:16px;"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;"><input type="checkbox" checked> 代练</label><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;"><input type="checkbox" checked> 陪玩</label></div></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>状态</div><div style="display:flex;gap:16px;"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;"><input type="radio" name="gameStatus" checked> 启用</label><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;"><input type="radio" name="gameStatus"> 禁用</label></div></div>';
  openModal(title,body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="toast(\'✓ '+(isNew?'创建成功':'保存成功')+'\');closeModal()">'+(isNew?'确认创建':'保存')+'</button>');
}
function openServiceEdit(isNew,name,code,specType,specVals,on){
  var title=isNew?'添加服务':'编辑服务';
  var n=isNew?'':name,c=isNew?'':code,st=isNew?'':specType,sv=isNew?'':specVals,chk=isNew?true:on;
  // Parse spec values (comma-separated)
  var vals=sv?sv.split(','):[''];
  var valsHTML='';
  vals.forEach(function(v,i){
    valsHTML+='<div style="display:flex;gap:8px;margin-bottom:8px;" id="sv-row-'+i+'"><input class="ant-input" value="'+v+'" placeholder="如：青铜→钻石" style="flex:1;"><button class="ant-btn ant-btn-sm" onclick="var el=document.getElementById(\'sv-row-'+i+'\');el.parentNode.removeChild(el);" style="flex-shrink:0;">✕</button></div>';
  });
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>服务名称</div><input class="ant-input" value="'+n+'" placeholder="如：排位上分"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>服务代码</div><select class="ant-input"><option '+(c?'':'selected')+'>请选择关联代码</option><option '+(c==='rank_push'?'selected':'')+'>rank_push</option><option '+(c==='task_farm'?'selected':'')+'>task_farm</option><option '+(c==='level_up'?'selected':'')+'>level_up</option><option '+(c==='gear_farm'?'selected':'')+'>gear_farm</option></select></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>规格类型</div><select class="ant-input"><option '+(st==='段位范围'?'selected':'')+'>段位范围</option><option '+(st==='任务类型'?'selected':'')+'>任务类型</option><option '+(st==='等级范围'?'selected':'')+'>等级范围</option><option '+(st==='刷取次数'?'selected':'')+'>刷取次数</option><option>哈夫币数量</option></select></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>规格数值</div><div id="sv-list">'+valsHTML+'</div><button class="ant-btn ant-btn-sm" onclick="var el=document.getElementById(\'sv-list\');var i=el.children.length;var d=document.createElement(\'div\');d.id=\'sv-row-\'+i;d.style.cssText=\'display:flex;gap:8px;margin-bottom:8px;\';d.innerHTML=\'<input class=ant-input placeholder=如：青铜→钻石 style=flex:1><button class=ant-btn ant-btn-sm onclick=this.parentNode.parentNode.removeChild(this.parentNode) style=flex-shrink:0>✕</button>\';el.appendChild(d);">+ 添加数值</button></div><div class="ant-form-item"><div class="ant-form-label">状态</div><div style="display:flex;gap:16px;"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;"><input type="radio" name="svcStatus" '+(chk?'checked':'')+'> 启用</label><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;"><input type="radio" name="svcStatus" '+(!chk?'checked':'')+'> 禁用</label></div></div>';
  openModal(title,body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="toast(\'✓ '+(isNew?'添加成功':'保存成功')+'\');closeModal();openServiceConfig()">'+(isNew?'确认添加':'保存')+'</button>');
}
function openServiceConfig(){
  var toggleBtn=function(on){return on?'<span style="display:inline-block;width:40px;height:22px;background:var(--primary);border-radius:11px;position:relative;cursor:pointer;" onclick="toast(\'状态已切换\')"><span style="position:absolute;right:2px;top:2px;width:18px;height:18px;background:#fff;border-radius:50%;"></span></span>':'<span style="display:inline-block;width:40px;height:22px;background:#ccc;border-radius:11px;position:relative;cursor:pointer;" onclick="toast(\'状态已切换\')"><span style="position:absolute;left:2px;top:2px;width:18px;height:18px;background:#fff;border-radius:50%;"></span></span>';};
  var rows=[
    {name:'排位上分',code:'rank_push',specType:'段位范围',specVals:'青铜→钻石,黄金→铂金,铂金→钻石,钻石→黑鹰,黑鹰→统帅',on:true},
    {name:'任务代打',code:'task_farm',specType:'任务类型',specVals:'周常全清,日常任务,主线任务',on:true},
    {name:'账号练级',code:'level_up',specType:'等级范围',specVals:'1→30级,30→60级,60→80级',on:true},
    {name:'装备刷取',code:'gear_farm',specType:'刷取次数',specVals:'1次,3次,5次',on:false}
  ];
  var body='<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><div style="font-weight:600;">三角洲行动 — 服务类型配置</div><button class="ant-btn ant-btn-primary ant-btn-sm" onclick="openServiceEdit(true)">+ 添加服务</button></div><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>服务名称</th><th>服务代码</th><th>规格类型</th><th>状态</th><th>操作</th></tr></thead><tbody>';
  rows.forEach(function(r){
    body+='<tr><td style="font-weight:500;">'+r.name+'</td><td>'+r.code+'</td><td><span class="ant-tag ant-tag-primary">'+r.specType+'</span></td><td>'+toggleBtn(r.on)+'</td><td><button class="ant-btn ant-btn-sm" onclick="openServiceEdit(false,\''+r.name+'\',\''+r.code+'\',\''+r.specType+'\',\''+r.specVals.replace(/'/g,"\\'")+'\','+r.on+')">编辑</button> <button class="ant-btn ant-btn-sm" onclick="toast(\''+(r.on?'已禁用':'已启用')+' '+r.name+'\')">'+(r.on?'禁用':'启用')+'</button></td></tr>';
  });
  body+='</tbody></table></div>';
  openModal('🛠 服务类型配置',body,'<button class="ant-btn" onclick="closeModal()">关闭</button>');
}
function rGameConfig(){
  var h='<div style="display:flex;justify-content:space-between;margin-bottom:16px;"><div style="font-size:var(--font-size-lg);font-weight:600;">游戏配置</div><button class="ant-btn ant-btn-primary" onclick="openGameEdit(true)">+ 添加游戏</button></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th class="sticky-col">操作</th><th>游戏ID</th><th>游戏名称</th><th>游戏图标</th><th>服务类型</th><th>订单类型</th><th>创建时间</th><th>创建人</th><th>状态</th></tr></thead><tbody><tr><td class="sticky-col" style="white-space:nowrap;"><button class="ant-btn ant-btn-sm" onclick="openGameEdit(false)">编辑</button> <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="toast(\'已删除\')">删除</button> <button class="ant-btn ant-btn-sm" onclick="openServiceConfig()">服务配置</button></td><td>1002</td><td style="font-weight:500;">三角洲行动</td><td><span style="font-size:24px;">🎯</span></td><td><span class="ant-tag ant-tag-primary">排位上分</span> <span class="ant-tag ant-tag-success">任务代打</span> <span class="ant-tag ant-tag-purple">账号练级</span> <span class="ant-tag ant-tag-warning">装备刷取</span></td><td><span class="ant-tag ant-tag-primary">代练</span> <span class="ant-tag ant-tag-success">陪玩</span></td><td>2026-05-19 10:30</td><td>管理员</td><td><span style="display:inline-block;width:40px;height:22px;background:var(--primary);border-radius:11px;position:relative;cursor:pointer;" onclick="toast(\'状态已切换\')"><span style="position:absolute;right:2px;top:2px;width:18px;height:18px;background:#fff;border-radius:50%;"></span></span></td></tr></tbody></table></div></div></div>';
  return h;
}

// ── 权限管理 ──
function openServiceTypeEdit(isNew,name,code,settleType,splitVal){
  var title=isNew?'添加服务类型':'编辑服务类型';
  var n=isNew?'':name,c=isNew?'':code,st=isNew?'按比例分成':settleType,sv=isNew?'70':splitVal;
  var splitHTML='';
  if(st==='按比例分成'){
    splitHTML='<div class="ant-row"><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>代练分成比例(%)</div><input class="ant-input" value="'+sv+'" placeholder="70" type="number"></div><div class="ant-form-item"><div class="ant-form-label">平台分成比例(%)</div><input class="ant-input" value="'+(100-parseInt(sv||70))+'" disabled style="background:#f5f5f5;"></div></div>';
  }else if(st==='固定金额'){
    splitHTML='<div class="ant-row"><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>代练固定金额(元)</div><input class="ant-input" value="'+sv+'" placeholder="200" type="number"></div><div class="ant-form-item"><div class="ant-form-label">平台抽成(元)</div><input class="ant-input" value="50" disabled style="background:#f5f5f5;"></div></div>';
  }else if(st==='按时计费'){
    splitHTML='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>时薪(元/小时)</div><input class="ant-input" value="'+sv+'" placeholder="50" type="number"></div>';
  }
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>类型名称</div><input class="ant-input" value="'+n+'" placeholder="如：排位上分"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>服务代码</div><input class="ant-input" value="'+c+'" placeholder="如：rank_push"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>结算类型</div><select class="ant-input" id="svc-settle-type" onchange="var v=this.value;var el=document.getElementById(\'split-area\');if(v===\'按比例分成\'){el.innerHTML=\'<div class=ant-row><div class=ant-form-item><div class=ant-form-label><span class=req>*</span>代练分成比例(%)</div><input class=ant-input value=70 placeholder=70 type=number></div><div class=ant-form-item><div class=ant-form-label>平台分成比例(%)</div><input class=ant-input value=30 disabled style=background:#f5f5f5></div></div>\';}else if(v===\'固定金额\'){el.innerHTML=\'<div class=ant-row><div class=ant-form-item><div class=ant-form-label><span class=req>*</span>代练固定金额(元)</div><input class=ant-input value=200 placeholder=200 type=number></div><div class=ant-form-item><div class=ant-form-label>平台抽成(元)</div><input class=ant-input value=50 disabled style=background:#f5f5f5></div></div>\';}else if(v===\'按时计费\'){el.innerHTML=\'<div class=ant-form-item><div class=ant-form-label><span class=req>*</span>时薪(元/小时)</div><input class=ant-input value=50 placeholder=50 type=number></div>\';}"><option '+(st==='按比例分成'?'selected':'')+'>按比例分成</option><option '+(st==='固定金额'?'selected':'')+'>固定金额</option><option '+(st==='按时计费'?'selected':'')+'>按时计费</option></select></div><div id="split-area">'+splitHTML+'</div>';
  openModal(title,body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="toast(\'✓ '+(isNew?'创建成功':'保存成功')+'\');closeModal()">'+(isNew?'确认创建':'保存')+'</button>');
}
function rServiceTypeMgmt(){
  var rows=[
    {name:'排位上分',code:'rank_push',settleType:'按比例分成',splitVal:'70',time:'2026-05-19 10:30',creator:'管理员'},
    {name:'任务代打',code:'task_farm',settleType:'固定金额',splitVal:'120',time:'2026-05-19 14:00',creator:'管理员'},
    {name:'账号练级',code:'level_up',settleType:'按时计费',splitVal:'50',time:'2026-05-20 09:00',creator:'管理员'},
    {name:'装备刷取',code:'gear_farm',settleType:'按比例分成',splitVal:'60',time:'2026-05-20 11:30',creator:'管理员'}
  ];
  var splitLabel=function(r){
    if(r.settleType==='按比例分成') return '代练 '+r.splitVal+'% / 平台 '+(100-parseInt(r.splitVal))+'%';
    if(r.settleType==='固定金额') return '代练 ¥'+r.splitVal+' / 平台抽 ¥50';
    if(r.settleType==='按时计费') return '¥'+r.splitVal+'/小时';
    return '-';
  };
  var h='<div style="display:flex;justify-content:space-between;margin-bottom:16px;"><div style="font-size:var(--font-size-lg);font-weight:600;">服务类型管理</div><button class="ant-btn ant-btn-primary" onclick="openServiceTypeEdit(true)">+ 添加类型</button></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>类型名称</th><th>服务代码</th><th>结算类型</th><th>分成设置</th><th>创建时间</th><th>创建人</th><th>操作</th></tr></thead><tbody>';
  rows.forEach(function(r){
    h+='<tr><td style="font-weight:500;">'+r.name+'</td><td>'+r.code+'</td><td><span class="ant-tag ant-tag-primary">'+r.settleType+'</span></td><td>'+splitLabel(r)+'</td><td>'+r.time+'</td><td>'+r.creator+'</td><td><button class="ant-btn ant-btn-sm" onclick="openServiceTypeEdit(false,\''+r.name+'\',\''+r.code+'\',\''+r.settleType+'\',\''+r.splitVal+'\')">编辑</button> <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="toast(\'已删除\')">删除</button></td></tr>';
  });
  h+='</tbody></table></div></div></div>';
  return h;
}
function rPermissionMgmt(){var roles=[{code:'root',name:'平台管理员',builtin:'是',st:'ant-tag-success',stt:'启用',desc:'系统最高权限，处理特殊事件',time:'2026-05-19'},{code:'operator',name:'平台运营',builtin:'是',st:'ant-tag-success',stt:'启用',desc:'订单录入、代练管理、工会管理、系统配置',time:'2026-05-19'},{code:'cs',name:'平台客服',builtin:'是',st:'ant-tag-success',stt:'启用',desc:'订单审核、验收、结算',time:'2026-05-19'},{code:'finance',name:'平台财务',builtin:'是',st:'ant-tag-success',stt:'启用',desc:'提现审核、工会/代练/客服结算',time:'2026-05-20'},{code:'guild_admin',name:'工会管理员',builtin:'是',st:'ant-tag-success',stt:'启用',desc:'工会最高权限，管理本工会代练',time:'2026-05-20'},{code:'guild_operator',name:'工会运营',builtin:'是',st:'ant-tag-success',stt:'启用',desc:'订单录入，管理本工会人员和订单',time:'2026-05-20'},{code:'booster',name:'打手',builtin:'是',st:'ant-tag-success',stt:'启用',desc:'接单、执行、交付、提现',time:'2026-05-19'}];var h='<div style="margin-bottom:16px;"><button class="ant-btn ant-btn-primary">+ 添加角色</button></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>编码</th><th>名称</th><th>内置角色</th><th>状态</th><th>描述</th><th>创建时间</th><th>操作</th></tr></thead><tbody>';roles.forEach(function(r){h+='<tr><td>'+r.code+'</td><td style="font-weight:500;">'+r.name+'</td><td><span class="ant-tag ant-tag-success">'+r.builtin+'</span></td><td><span class="ant-tag '+r.st+'">'+r.stt+'</span></td><td>'+r.desc+'</td><td>'+r.time+'</td><td><button class="ant-btn ant-btn-sm">编辑</button></td></tr>';});h+='</tbody></table></div></div></div>';return h;}

// ── 个人中心 ──
var profile={uid:'U20260527001',name:'张运营',phone:'138****8888',email:'zhangyy@example.com',alipayName:'张运',alipayIdCard:'3201**********1234',alipayAccount:'138****8888',alipayBound:true};

function openProfileCenter(){
  var h='';
  h+='<div style="display:flex;gap:40px;margin-bottom:20px;"><div style="color:var(--text-secondary);">姓名：<span style="color:var(--text);">'+profile.name+'</span></div><div style="color:var(--text-secondary);">用户编号：<span style="color:var(--text);">'+profile.uid+'</span></div></div>';

  h+='<div style="margin:20px 0;border-top:1px solid var(--border-light);"></div>';

  h+='<div class="bind-item"><div class="bind-info"><div class="bind-label">手机号</div><div class="bind-val">'+profile.phone+'</div></div><div class="bind-action"><button class="ant-btn ant-btn-sm" onclick="openBindPhone()">更换绑定</button></div></div>';
  h+='<div class="bind-item"><div class="bind-info"><div class="bind-label">邮箱</div><div class="bind-val">'+profile.email+'</div></div><div class="bind-action"><button class="ant-btn ant-btn-sm" onclick="openBindEmail()">更换绑定</button></div></div>';
  h+='<div class="bind-item"><div class="bind-info"><div class="bind-label">登录密码</div><div class="bind-val">建议定期更换密码以保证账户安全</div></div><div class="bind-action"><button class="ant-btn ant-btn-sm" onclick="openChangePwd()">修改密码</button></div></div>';

  h+='<div style="margin:20px 0;border-top:1px solid var(--border-light);"></div>';

  if(profile.alipayBound){
    h+='<div class="bind-item"><div class="bind-info"><div class="bind-label">支付宝账号</div><div class="bind-val">真实姓名：'+profile.alipayName+'</div><div class="bind-val">身份证号：'+profile.alipayIdCard+'</div><div class="bind-val">账号：'+profile.alipayAccount+'</div></div><div class="bind-action"><button class="ant-btn ant-btn-danger ant-btn-sm" onclick="unbindAlipay()">解绑</button></div></div>';
  }else{
    h+='<div class="bind-item"><div class="bind-info"><div class="bind-label">支付宝账号</div><div class="bind-val" style="color:var(--text-tertiary);">暂未绑定支付宝账号</div></div><div class="bind-action"><button class="ant-btn ant-btn-primary ant-btn-sm" onclick="openBindAlipay()">绑定账号</button></div></div>';
  }

  openModal('个人中心',h,'<button class="ant-btn" onclick="closeModal()">关闭</button>');
}

function openBindPhone(){
  var body='<div class="ant-form-item"><div class="ant-form-label">新手机号</div><input class="ant-input" id="bindPhone" placeholder="请输入新手机号"></div><div class="ant-form-item"><div class="ant-form-label">验证码</div><div style="display:flex;gap:8px;"><input class="ant-input" id="bindPhoneCode" placeholder="请输入验证码" style="flex:1;"><button class="ant-btn" onclick="toast(\'验证码已发送\')">获取验证码</button></div></div>';
  openModal('更换手机号绑定',body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="confirmBindPhone()">确认绑定</button>');
}

function confirmBindPhone(){
  var v=document.getElementById('bindPhone').value;
  if(!v){toast('请输入手机号');return;}
  profile.phone=v.replace(/(\d{3})\d{4}(\d{4})/,'$1****$2');
  toast('手机号已更换');
  closeModal();
  openProfileCenter();
}

function openBindEmail(){
  var body='<div class="ant-form-item"><div class="ant-form-label">新邮箱地址</div><input class="ant-input" id="bindEmail" placeholder="请输入新邮箱地址"></div><div class="ant-form-item"><div class="ant-form-label">验证码</div><div style="display:flex;gap:8px;"><input class="ant-input" id="bindEmailCode" placeholder="请输入验证码" style="flex:1;"><button class="ant-btn" onclick="toast(\'验证码已发送\')">获取验证码</button></div></div>';
  openModal('更换邮箱绑定',body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="confirmBindEmail()">确认绑定</button>');
}

function confirmBindEmail(){
  var v=document.getElementById('bindEmail').value;
  if(!v){toast('请输入邮箱地址');return;}
  profile.email=v;
  toast('邮箱已更换');
  closeModal();
  openProfileCenter();
}

function openChangePwd(){
  var body='<div class="ant-form-item"><div class="ant-form-label">原密码</div><input class="ant-input" type="password" id="oldPwd" placeholder="请输入原密码"></div><div class="ant-form-item"><div class="ant-form-label">新密码</div><input class="ant-input" type="password" id="newPwd" placeholder="请输入新密码"></div><div class="ant-form-item"><div class="ant-form-label">确认新密码</div><input class="ant-input" type="password" id="confirmPwd" placeholder="请再次输入新密码"></div>';
  openModal('修改登录密码',body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="confirmChangePwd()">确认修改</button>');
}

function confirmChangePwd(){
  var np=document.getElementById('newPwd').value;
  var cp=document.getElementById('confirmPwd').value;
  if(!np){toast('请输入新密码');return;}
  if(np!==cp){toast('两次输入的密码不一致');return;}
  toast('密码修改成功');
  closeModal();
}

function openBindAlipay(){
  var body='<div class="ant-form-item"><div class="ant-form-label">真实姓名</div><input class="ant-input" id="alipayName" placeholder="请输入支付宝实名" value="'+profile.alipayName+'"></div><div class="ant-form-item"><div class="ant-form-label">身份证号</div><input class="ant-input" id="alipayIdCard" placeholder="请输入身份证号" value="'+(profile.alipayIdCard||'')+'"></div><div class="ant-form-item"><div class="ant-form-label">支付宝账号</div><input class="ant-input" id="alipayAccount" placeholder="请输入支付宝账号" value="'+profile.alipayAccount+'"></div>';
  openModal((profile.alipayBound?'更换':'绑定')+'支付宝账号',body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="confirmBindAlipay()">确认'+(profile.alipayBound?'更换':'绑定')+'</button>');
}

function confirmBindAlipay(){
  var n=document.getElementById('alipayName').value;
  var id=document.getElementById('alipayIdCard').value;
  var a=document.getElementById('alipayAccount').value;
  if(!n||!id||!a){toast('请填写完整信息');return;}
  profile.alipayName=n;
  profile.alipayIdCard=id;
  profile.alipayAccount=a;
  profile.alipayBound=true;
  toast('支付宝账号已绑定');
  closeModal();
  openProfileCenter();
}

function unbindAlipay(){
  profile.alipayBound=false;
  profile.alipayName='';
  profile.alipayAccount='';
  toast('支付宝账号已解绑');
  openProfileCenter();
}

// ── INIT ──
renderTree();
renderContent();