
var curPage='home',openGroup='workspace',curTab='全部',curSubTab='按日统计',toastTimer,currentRole='admin',grabCounter=0,assetDateFrom='',assetDateTo='',curAssetTab='order',guildDetailIdx=0,guildDetailCurTab='order',guildDetailOrderPage=1,guildDetailSettlePage=1;

var roleDefs=[
  {key:'admin',name:'平台管理员',icon:'👑',css:'admin',desc:'系统最高权限，处理特殊事件'},
  {key:'operator',name:'平台运营',icon:'⚙️',css:'op',desc:'订单录入、代练管理、机构管理、系统配置'},
  {key:'cs',name:'平台客服',icon:'🎧',css:'cs',desc:'订单审核、验收、结算'},
  {key:'finance',name:'平台财务',icon:'💰',css:'fin',desc:'提现审核、机构/代练/客服结算'},
  {key:'guild_admin',name:'机构管理员',icon:'🏛️',css:'guild',desc:'机构最高权限，管理本机构代练'},
  {key:'guild_operator',name:'机构运营',icon:'🏢',css:'guild',desc:'订单录入，管理本机构人员和订单'},
  {key:'booster',name:'代练',icon:'🎮',css:'booster',desc:'接单、执行、交付、提现'}
];

function getRole(){return roleDefs.find(function(r){return r.key===currentRole;})||roleDefs[0];}

function roleVisible(pageId){
  var r=currentRole;
  // 平台资产：仅平台管理员
  if(pageId==='platform-assets') return r==='admin';
  // 我的资产：仅机构和代练
  if(pageId==='my-assets') return r==='guild_admin'||r==='guild_operator'||r==='booster';
  // 订单录入：客服、财务、代练不可见（admin/operator/guild_admin/guild_operator）
  if(pageId==='order-entry') return r==='admin'||r==='operator'||r==='guild_admin'||r==='guild_operator';
  // 订单管理：所有角色可见（代练仅看自己的数据）
  if(pageId==='order-mgmt') return true;
  // 订单池：客服和财务不可见
  if(pageId==='order-pool') return r!=='cs'&&r!=='finance';
  // 财务管理-机构结算：仅财务
  if(pageId==='guild-settlement') return r==='finance';
  // 财务管理-客服结算/提现审核：管理员和财务
  if(pageId==='cs-settlement'||pageId==='withdraw-audit') return r==='admin'||r==='finance';
  // 机构管理：仅管理员
  if(pageId==='org-mgmt') return r==='admin';
  // 岗位管理、用户管理、代练审核、下家绑定：管理员和运营
  if(pageId==='position-mgmt'||pageId==='user-mgmt'||pageId==='booster-review'||pageId==='bind-set') return r==='admin'||r==='operator';
  // 游戏设置、服务类型：管理员和运营
  if(pageId==='game-config'||pageId==='service-type-mgmt') return r==='admin'||r==='operator';
  // 权限管理：仅管理员
  if(pageId==='permission-mgmt') return r==='admin';
  return true;
}

// 一期范围判断
function isPhase1(pageId){
  return['home','platform-assets','my-assets','order-entry','order-mgmt','order-pool','guild-settlement','org-mgmt','position-mgmt','user-mgmt','game-config','permission-mgmt'].indexOf(pageId)!==-1;
}

// 订单操作权限判断（按文档4.1角色×操作矩阵）
function canReview(){ return currentRole==='admin'||currentRole==='cs'; }
function canManage(){ return currentRole==='admin'||currentRole==='operator'||currentRole==='guild_admin'; }
function canOperate(){ return currentRole==='admin'||currentRole==='operator'||currentRole==='guild_admin'||currentRole==='guild_operator'; }
function canVerify(){ return currentRole==='admin'||currentRole==='operator'||currentRole==='cs'; }
function canSettle(){ return currentRole==='admin'||currentRole==='operator'||currentRole==='guild_admin'||currentRole==='guild_operator'; }
function canReEnter(){ return currentRole==='admin'||currentRole==='operator'||currentRole==='guild_admin'||currentRole==='guild_operator'; }

function currentUserGuild(){if(currentRole==='guild_admin'||currentRole==='guild_operator')return'三角洲机构A组';return'';}
function currentBoosterName(){if(currentRole==='booster')return'王代练';return'';}

function roleHasGroup(groupKey){
  var items=menuTree.find(function(g){return g.key===groupKey;});
  if(!items) return false;
  return items.children.some(function(c){return roleVisible(c.id);});
}

var menuTree=[
  {key:'workspace',icon:'📊',label:'工作台',children:[
    {id:'home',label:'首页',icon:'🏠'},
    {id:'platform-assets',label:'平台资产',icon:'🏦'},
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
    {id:'guild-settlement',label:'机构结算',icon:'🏛️'},
    {id:'cs-settlement',label:'客服结算',icon:'💳'},
    {id:'withdraw-audit',label:'提现审核',icon:'🔐',badge:'3'}
  ]},
  {key:'personnel',icon:'👥',label:'人员管理',children:[
    {id:'org-mgmt',label:'机构管理',icon:'🏢'},
    {id:'position-mgmt',label:'岗位管理',icon:'📝'},
    {id:'user-mgmt',label:'用户管理',icon:'👤'},
    {id:'booster-review',label:'代练审核',icon:'✅',badge:'2'},
    {id:'bind-set',label:'下家绑定',icon:'🔗'}
  ]},
  {key:'system',icon:'⚙️',label:'系统管理',children:[
    {id:'game-config',label:'游戏设置',icon:'🎮'},
    {id:'service-type-mgmt',label:'服务类型',icon:'🛠'},
    {id:'permission-mgmt',label:'权限管理',icon:'🔐'}
  ]}
];

var pageTitles={
  home:'工作台 > 首页','platform-assets':'工作台 > 平台资产','my-assets':'工作台 > 我的资产',
  'order-entry':'订单管理 > 订单录入','order-mgmt':'订单管理 > 订单管理','order-pool':'订单管理 > 订单池',
  'data-overview':'数据报表 > 数据概览','order-report':'数据报表 > 订单报表',
  'guild-settlement':'财务管理 > 机构结算','cs-settlement':'财务管理 > 客服结算','withdraw-audit':'财务管理 > 提现审核',
  'org-mgmt':'人员管理 > 机构管理','position-mgmt':'人员管理 > 岗位管理','user-mgmt':'人员管理 > 用户管理','booster-review':'人员管理 > 代练审核','bind-set':'人员管理 > 下家绑定',
  'game-config':'系统管理 > 游戏设置','service-type-mgmt':'系统管理 > 服务类型','permission-mgmt':'系统管理 > 权限管理'
};

var pageIcons={
  home:'📊','platform-assets':'🏦','my-assets':'💎','order-entry':'➕','order-mgmt':'📋','order-pool':'📦',
  'data-overview':'📊','order-report':'📑','guild-settlement':'🏛️','cs-settlement':'💳','withdraw-audit':'🔐',
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
      var dis=!isPhase1(c.id);
      var disCls=dis?' disabled':'';
      var disAttr=dis?' onclick="event.stopPropagation();return false;"':'';
      h+='<div class="tree-item'+(curPage===c.id?' active':'')+disCls+'" data-page="'+c.id+'"'+disAttr+'><span class="dot"></span>'+c.label;
      if(dis) h+=' <span style="font-size:10px;color:var(--sider-text);opacity:.4;">(二期)</span>';
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
      if(this.classList.contains('disabled')) return;
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
  var role=getRole();
  var badge=document.getElementById('top-role');
  badge.textContent=role.icon+' '+role.name;
  badge.className='role-badge '+role.css;
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
  var b=document.getElementById('top-role');
  var s=document.getElementById('role-switch-btn');
  if(!p.contains(e.target)&&e.target!==b&&!b.contains(e.target)&&e.target!==s){
    p.classList.remove('show');
  }
});

function openModal(title,bodyHTML,footerHTML){
  var overlay=document.getElementById('modal-overlay');
  var box=document.getElementById('modal-box');
  box.className='modal-box';
  box.innerHTML='<div class="modal-header">'+title+'<span class="close" onclick="closeModal()">✕</span></div><div class="modal-body">'+bodyHTML+'</div>'+(footerHTML?'<div class="modal-footer">'+footerHTML+'</div>':'');
  overlay.classList.add('show');
}

function closeModal(){
  document.getElementById('modal-overlay').classList.remove('show');
}

function showOrderDetail(oid){
  var box=document.getElementById('modal-box');box.classList.add('wider');
  var rowStyle='display:flex;gap:20px;margin-bottom:16px;';
  var colStyle='flex:1;';
  var infoHTML=''+
    // Row 1: 服务类型 | 服务规格 | 订单金额 | 订单状态
    '<div style="'+rowStyle+'">'+
      '<div style="'+colStyle+'"><div class="ant-form-item"><div class="ant-form-label">服务类型</div><div>跑刀</div></div></div>'+
      '<div style="'+colStyle+'"><div class="ant-form-item"><div class="ant-form-label">服务规格</div><div>300万哈夫币</div></div></div>'+
      '<div style="'+colStyle+'"><div class="ant-form-item"><div class="ant-form-label">订单金额</div><div style="font-weight:600;font-size:16px;color:var(--primary);">¥298.00</div></div></div>'+
      '<div style="'+colStyle+'"><div class="ant-form-item"><div class="ant-form-label">订单状态</div><span class="ant-tag ant-tag-primary">执行中</span></div></div>'+
    '</div>'+
    // Row 2: 订单类型 | 创建时间 | 当前代练 | 指派客服
    '<div style="'+rowStyle+'">'+
      '<div style="'+colStyle+'"><div class="ant-form-item"><div class="ant-form-label">订单类型</div><div>代练</div></div></div>'+
      '<div style="'+colStyle+'"><div class="ant-form-item"><div class="ant-form-label">创建时间</div><div>2026-05-26 14:30</div></div></div>'+
      '<div style="'+colStyle+'"><div class="ant-form-item"><div class="ant-form-label">当前代练</div><div>王代练</div></div></div>'+
      '<div style="'+colStyle+'"><div class="ant-form-item"><div class="ant-form-label">指派客服</div><div>小李</div></div></div>'+
    '</div>'+
    // Row 3: 游戏信息（融合角色名称）
    '<div style="'+rowStyle+'">'+
      '<div style="flex:1;"><div class="ant-form-item"><div class="ant-form-label">游戏信息</div><div>三角洲行动端游 / WeGame / QQ账号 / 角色：玩家A</div></div></div>'+
    '</div>'+
    // Row 4: 订单标题 | 订单备注
    '<div style="'+rowStyle+'">'+
      '<div style="flex:1;"><div class="ant-form-item"><div class="ant-form-label">订单标题</div><div>跑刀 - 300万哈夫币 - 48小时内完成</div></div></div>'+
      '<div style="flex:1;"><div class="ant-form-item"><div class="ant-form-label">订单备注</div><div style="color:var(--text-secondary);">客户要求48小时内完成，账号需保持在线状态</div></div></div>'+
    '</div>';
  var timelineHTML='<div style="border-top:1px solid var(--border-light);padding-top:16px;margin-top:8px;">'+
    '<div style="font-weight:600;margin-bottom:12px;font-size:14px;">📋 操作流水</div>'+
    '<div style="position:relative;padding-left:24px;">'+
    '<div style="position:absolute;left:8px;top:0;bottom:0;width:2px;background:var(--border-light);"></div>'+
    '<div style="position:relative;margin-bottom:16px;"><div style="position:absolute;left:-20px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--primary);border:2px solid #fff;box-shadow:0 0 0 2px var(--primary);"></div><div style="font-size:13px;color:var(--text-secondary);">2026-05-26 14:30</div><div style="font-weight:500;">录入订单</div><div style="font-size:13px;color:var(--text-secondary);">操作人：张运营</div><div style="font-size:13px;">订单来源：外部订单</div><div style="margin-top:4px;"><a class="link" onclick="toast(\'已查看截图\')" style="font-size:13px;">📷 查看截图 (2张)</a></div></div>'+
    '<div style="position:relative;margin-bottom:16px;"><div style="position:absolute;left:-20px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--success);border:2px solid #fff;box-shadow:0 0 0 2px var(--success);"></div><div style="font-size:13px;color:var(--text-secondary);">2026-05-26 15:00</div><div style="font-weight:500;">审核通过</div><div style="font-size:13px;color:var(--text-secondary);">操作人：小李（客服）</div><div style="font-size:13px;color:var(--text-secondary);">审核意见：订单信息完整，符合要求，予以通过</div></div>'+
    '<div style="position:relative;margin-bottom:16px;"><div style="position:absolute;left:-20px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--primary);border:2px solid #fff;box-shadow:0 0 0 2px var(--primary);"></div><div style="font-size:13px;color:var(--text-secondary);">2026-05-26 15:30</div><div style="font-weight:500;">指派代练</div><div style="font-size:13px;color:var(--text-secondary);">操作人：张运营</div><div style="font-size:13px;">指派代练：王代练</div></div>'+
    '<div style="position:relative;margin-bottom:16px;"><div style="position:absolute;left:-20px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--warning);border:2px solid #fff;box-shadow:0 0 0 2px var(--warning);"></div><div style="font-size:13px;color:var(--text-secondary);">2026-05-27 10:00</div><div style="font-weight:500;">暂停</div><div style="font-size:13px;color:var(--text-secondary);">操作人：张运营</div><div style="font-size:13px;">暂停原因：账号异常，需客户配合验证</div><div style="margin-top:4px;"><a class="link" onclick="toast(\'已查看截图\')" style="font-size:13px;">📷 查看截图 (3张)</a></div></div>'+
    '<div style="position:relative;margin-bottom:16px;"><div style="position:absolute;left:-20px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--primary);border:2px solid #fff;box-shadow:0 0 0 2px var(--primary);"></div><div style="font-size:13px;color:var(--text-secondary);">2026-05-27 14:00</div><div style="font-weight:500;">恢复</div><div style="font-size:13px;color:var(--text-secondary);">操作人：张运营</div><div style="font-size:13px;">账号验证通过，恢复订单执行</div></div>'+
    '<div style="position:relative;margin-bottom:16px;"><div style="position:absolute;left:-20px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--success);border:2px solid #fff;box-shadow:0 0 0 2px var(--success);"></div><div style="font-size:13px;color:var(--text-secondary);">2026-05-28 18:00</div><div style="font-weight:500;">完成</div><div style="font-size:13px;color:var(--text-secondary);">操作人：王代练</div><div style="font-size:13px;">完成情况：按要求完成</div><div style="margin-top:4px;"><a class="link" onclick="toast(\'已查看截图\')" style="font-size:13px;">📷 查看截图 (5张)</a></div></div>'+
    '<div style="position:relative;margin-bottom:16px;"><div style="position:absolute;left:-20px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--success);border:2px solid #fff;box-shadow:0 0 0 2px var(--success);"></div><div style="font-size:13px;color:var(--text-secondary);">2026-05-28 19:00</div><div style="font-weight:500;">验收通过</div><div style="font-size:13px;color:var(--text-secondary);">操作人：小李（客服）</div><div style="font-size:13px;color:var(--text-secondary);">验收意见：订单完成质量合格，予以验收</div></div>'+
    '<div style="position:relative;margin-bottom:4px;"><div style="position:absolute;left:-20px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--primary);border:2px solid #fff;box-shadow:0 0 0 2px var(--primary);"></div><div style="font-size:13px;color:var(--text-secondary);">2026-05-29 10:00</div><div style="font-weight:500;">结算</div><div style="font-size:13px;color:var(--text-secondary);">操作人：张运营</div><div style="font-size:13px;">结算金额：¥298.00</div></div>'+
    '</div></div>';
  var body=infoHTML+timelineHTML;
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
  if(!isPhase1(curPage)){curPage='home';openGroup='workspace';renderTree();}
  var title=pageTitles[curPage]||curPage;
  setBreadcrumb(title);
  var c=document.getElementById('content-area');
  var fn=window['r'+curPage.split('-').map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join('').replace(/-/g,'')];
  c.innerHTML=fn?fn():'<div class="ant-card"><div class="ant-card-body" style="text-align:center;padding:80px;color:var(--text-secondary);">功能开发中</div></div>';
}

function doLogin(){
  var acct=document.getElementById('login-acct').value.trim();
  var pwd=document.getElementById('login-pwd').value;
  if(!acct){toast('请输入账号');return;}
  if(!pwd){toast('请输入密码');return;}
  var u=userList.find(function(x){return x.acct===acct;});
  if(!u){toast('账号不存在');return;}
  if(u.password!==pwd){toast('密码错误');return;}
  document.getElementById('login-overlay').style.display='none';
  var role=getRole();
  var badge=document.getElementById('top-role');
  badge.textContent=role.icon+' '+role.name;
  badge.className='role-badge '+role.css;
  openGroup='workspace';renderTree();renderContent();
}
function doLogout(){document.getElementById('login-overlay').style.display='flex';}

// ─── PAGE RENDER FUNCTIONS ───

function exportCSV(headers,rows,filename){
  var csv='\uFEFF'+headers.join(',')+'\n';
  rows.forEach(function(r){csv+=r.map(function(c){return'"'+String(c||'').replace(/"/g,'""')+'"';}).join(',')+'\n';});
  var b=new Blob([csv],{type:'text/csv;charset=utf-8'});
  var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=filename;a.click();URL.revokeObjectURL(a.href);
}
function rHome(){
  var r=currentRole;
  // ── 平台管理员：全量待处理汇总，点击卡片跳转对应页面集中处理 ──
  if(r==='admin'){
    return '<div class="stat-row"><div class="stat-item" onclick="curPage=\'order-mgmt\';curTab=\'待审核\';openGroup=\'order\';renderTree();renderContent()"><div class="label">待审核订单</div><div class="value" style="color:var(--danger);">5</div><div class="sub">客服待处理 →</div></div><div class="stat-item" onclick="curPage=\'order-mgmt\';openGroup=\'order\';renderTree();renderContent()"><div class="label">待验收订单</div><div class="value" style="color:var(--warning);">12</div><div class="sub">客服待处理 →</div></div><div class="stat-item" style="opacity:.5;cursor:not-allowed;pointer-events:none;"><div class="label">待审核代练（二期）</div><div class="value" style="color:var(--danger);">2</div><div class="sub">运营待处理 →</div></div><div class="stat-item" style="opacity:.5;cursor:not-allowed;pointer-events:none;"><div class="label">待审核提现（二期）</div><div class="value" style="color:var(--warning);">3</div><div class="sub">¥8,500 财务待处理 →</div></div></div><div class="stat-row"><div class="stat-item" onclick="curPage=\'guild-settlement\';openGroup=\'finance\';renderTree();renderContent()"><div class="label">机构结算申请</div><div class="value" style="color:var(--warning);">2</div><div class="sub">¥13,510 财务待处理 →</div></div><div class="stat-item"><div class="label">今日新增订单</div><div class="value">28</div><div class="sub" style="color:var(--success);">↑ 32% 较昨日</div></div><div class="stat-item"><div class="label">执行中订单</div><div class="value" style="color:var(--primary);">45</div><div class="sub">在册代练 32 人 · 5 机构</div></div><div class="stat-item"><div class="label">今日流水</div><div class="value">¥18,520</div><div class="sub">待结算 ¥6,800</div></div></div><div style="margin-top:16px;"><div class="ant-card"><div class="ant-card-head">⚡ 快捷操作</div><div class="ant-card-body"><div style="display:flex;gap:16px;flex-wrap:wrap;"><div class="stat-item" onclick="curPage=\'order-mgmt\';curTab=\'待审核\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;"><div style="width:40px;height:40px;background:var(--danger-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">📋</div><div><div style="font-weight:500;">订单审核</div><div style="font-size:var(--font-size-sm);color:var(--danger);">5 单待审核</div></div></div><div class="stat-item" style="display:flex;align-items:center;gap:12px;min-width:200px;opacity:.5;cursor:not-allowed;pointer-events:none;"><div style="width:40px;height:40px;background:var(--warning-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">🔍</div><div><div style="font-weight:500;">代练审核（二期）</div><div style="font-size:var(--font-size-sm);color:var(--danger);">2 人待审核</div></div></div><div class="stat-item" style="display:flex;align-items:center;gap:12px;min-width:200px;opacity:.5;cursor:not-allowed;pointer-events:none;"><div style="width:40px;height:40px;background:var(--danger-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">💳</div><div><div style="font-weight:500;">提现审核（二期）</div><div style="font-size:var(--font-size-sm);color:var(--warning);">3 笔 ¥8,500</div></div></div><div class="stat-item" onclick="curPage=\'guild-settlement\';openGroup=\'finance\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">🏛️</div><div><div style="font-weight:500;">机构结算</div><div style="font-size:var(--font-size-sm);color:var(--warning);">2 笔 ¥13,510</div></div></div></div></div></div></div>';
  }
  // ── 平台运营：待审核代练 + 订单池分配 + 录入订单 ──
  if(r==='operator'){
    return '<div class="stat-row"><div class="stat-item" style="opacity:.5;cursor:not-allowed;pointer-events:none;"><div class="label">待审核代练身份（二期）</div><div class="value" style="color:var(--danger);">2</div><div class="sub">需尽快审核 →</div></div><div class="stat-item" onclick="curPage=\'order-pool\';openGroup=\'order\';renderTree();renderContent()"><div class="label">订单池可分配</div><div class="value" style="color:var(--primary);">8</div><div class="sub">待指派代练/机构 →</div></div><div class="stat-item"><div class="label">今日新增订单</div><div class="value">28</div><div class="sub" style="color:var(--success);">↑ 32% 较昨日</div></div><div class="stat-item"><div class="label">执行中订单</div><div class="value" style="color:var(--primary);">45</div><div class="sub">待验收 12 · 告警 2</div></div></div><div style="margin-top:16px;"><div class="ant-card"><div class="ant-card-head">⚡ 快捷操作</div><div class="ant-card-body"><div style="display:flex;gap:16px;flex-wrap:wrap;"><div class="stat-item" onclick="curPage=\'order-entry\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">➕</div><div><div style="font-weight:500;">录入订单</div><div style="font-size:var(--font-size-sm);color:var(--text-secondary);">手动 / Excel / API</div></div></div><div class="stat-item" onclick="curPage=\'order-pool\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--primary);"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">📦</div><div><div style="font-weight:500;">订单池分配</div><div style="font-size:var(--font-size-sm);color:var(--primary);">8 单待分配</div></div></div><div class="stat-item" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--danger);opacity:.5;cursor:not-allowed;pointer-events:none;"><div style="width:40px;height:40px;background:var(--danger-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">🔍</div><div><div style="font-weight:500;">代练身份审核（二期）</div><div style="font-size:var(--font-size-sm);color:var(--danger);">2 人待审核</div></div></div></div></div></div></div>';
  }
  // ── 平台客服：待审核订单 + 待验收订单 ──
  if(r==='cs'){
    return '<div class="stat-row"><div class="stat-item" onclick="curPage=\'order-mgmt\';curTab=\'待审核\';openGroup=\'order\';renderTree();renderContent()"><div class="label">待审核订单</div><div class="value" style="color:var(--danger);">5</div><div class="sub">点击进入订单审核 →</div></div><div class="stat-item" onclick="curPage=\'order-mgmt\';openGroup=\'order\';renderTree();renderContent()"><div class="label">待验收订单</div><div class="value" style="color:var(--warning);">12</div><div class="sub">代练已提交交付 →</div></div><div class="stat-item"><div class="label">今日处理订单</div><div class="value" style="color:var(--success);">15</div><div class="sub">通过 12 · 驳回 3</div></div><div class="stat-item"><div class="label">待结算订单</div><div class="value">8</div><div class="sub">已验收待确认结算</div></div></div><div style="margin-top:16px;"><div class="ant-card"><div class="ant-card-head">⚡ 快捷操作</div><div class="ant-card-body"><div style="display:flex;gap:16px;flex-wrap:wrap;"><div class="stat-item" onclick="curPage=\'order-mgmt\';curTab=\'待审核\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--danger);"><div style="width:40px;height:40px;background:var(--danger-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">📋</div><div><div style="font-weight:500;">订单审核</div><div style="font-size:var(--font-size-sm);color:var(--danger);">5 单待审核</div></div></div><div class="stat-item" onclick="curPage=\'order-mgmt\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--warning);"><div style="width:40px;height:40px;background:var(--warning-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">✅</div><div><div style="font-weight:500;">订单验收</div><div style="font-size:var(--font-size-sm);color:var(--warning);">12 单待验收</div></div></div></div></div></div></div>';
  }
  // ── 平台财务：机构结算申请 + 提现申请 ──
  if(r==='finance'){
    return '<div class="stat-row"><div class="stat-item" onclick="curPage=\'guild-settlement\';openGroup=\'finance\';renderTree();renderContent()"><div class="label">机构结算申请</div><div class="value" style="color:var(--warning);">2</div><div class="sub">¥13,510 待打款 →</div></div><div class="stat-item" style="opacity:.5;cursor:not-allowed;pointer-events:none;"><div class="label">提现申请（二期）</div><div class="value" style="color:var(--danger);">3</div><div class="sub">¥8,500 待审核 →</div></div><div class="stat-item"><div class="label">本月已结算</div><div class="value" style="color:var(--success);">¥68,500</div><div class="sub">代练 ¥38,200 · 机构 ¥24,300 · 客服 ¥6,000</div></div><div class="stat-item"><div class="label">本月平台收入</div><div class="value">¥98,200</div><div class="sub" style="color:var(--success);">利润率 30.2%</div></div></div><div style="margin-top:16px;"><div class="ant-card"><div class="ant-card-head">⚡ 快捷操作</div><div class="ant-card-body"><div style="display:flex;gap:16px;flex-wrap:wrap;"><div class="stat-item" onclick="curPage=\'guild-settlement\';openGroup=\'finance\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--warning);"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">🏛️</div><div><div style="font-weight:500;">机构结算处理</div><div style="font-size:var(--font-size-sm);color:var(--warning);">2 笔 ¥13,510</div></div></div><div class="stat-item" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--danger);opacity:.5;cursor:not-allowed;pointer-events:none;"><div style="width:40px;height:40px;background:var(--danger-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">💳</div><div><div style="font-weight:500;">提现审核处理（二期）</div><div style="font-size:var(--font-size-sm);color:var(--danger);">3 笔 ¥8,500</div></div></div></div></div></div></div>';
  }
  // ── 机构管理员 / 机构运营：录入 + 验收 + 结算 ──
  if(r==='guild_admin'||r==='guild_operator'){
    return '<div class="stat-row"><div class="stat-item" onclick="curPage=\'order-entry\';openGroup=\'order\';renderTree();renderContent()"><div class="label">今日录入订单</div><div class="value">6</div><div class="sub" style="color:var(--success);">↑ 2 单 较昨日</div></div><div class="stat-item" onclick="curPage=\'order-mgmt\';openGroup=\'order\';renderTree();renderContent()"><div class="label">机构执行中订单</div><div class="value" style="color:var(--primary);">18</div><div class="sub">待验收 5 单 →</div></div><div class="stat-item"><div class="label">机构本月流水</div><div class="value">¥32,500</div><div class="sub">待结算 ¥8,750</div></div><div class="stat-item" onclick="curPage=\'my-assets\';openGroup=\'workspace\';renderTree();renderContent()"><div class="label">机构账户余额</div><div class="value" style="color:var(--success);">¥24,880</div><div class="sub">可结算 ¥8,750 →</div></div></div><div style="margin-top:16px;"><div class="ant-card"><div class="ant-card-head">⚡ 快捷操作</div><div class="ant-card-body"><div style="display:flex;gap:16px;flex-wrap:wrap;"><div class="stat-item" onclick="curPage=\'order-entry\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">➕</div><div><div style="font-weight:500;">录入订单</div><div style="font-size:var(--font-size-sm);color:var(--text-secondary);">为本机构录入订单</div></div></div><div class="stat-item" onclick="curPage=\'order-mgmt\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--warning);"><div style="width:40px;height:40px;background:var(--warning-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">✅</div><div><div style="font-weight:500;">订单验收</div><div style="font-size:var(--font-size-sm);color:var(--warning);">5 单待验收</div></div></div><div class="stat-item" onclick="curPage=\'my-assets\';openGroup=\'workspace\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--success);"><div style="width:40px;height:40px;background:var(--success-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">💵</div><div><div style="font-weight:500;">机构结算</div><div style="font-size:var(--font-size-sm);color:var(--success);">¥8,750 可结算</div></div></div>'+(currentRole==='guild_admin'?'<div class="stat-item" onclick="openGuildSettle()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--primary);"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">💰</div><div><div style="font-weight:500;">发起结算</div><div style="font-size:var(--font-size-sm);color:var(--primary);">填写打款信息</div></div></div>':'')+'</div></div></div></div>';
  }
  // ── 代练：个人接单/提现 ──
  if(r==='booster'){
    return '<div class="stat-row"><div class="stat-item" onclick="curPage=\'order-pool\';openGroup=\'order\';renderTree();renderContent()"><div class="label">可接订单</div><div class="value" style="color:var(--primary);">8</div><div class="sub">订单池有单可抢 →</div></div><div class="stat-item"><div class="label">执行中订单</div><div class="value" style="color:var(--warning);">3</div><div class="sub">待提交交付 1 单</div></div><div class="stat-item" onclick="curPage=\'my-assets\';openGroup=\'workspace\';renderTree();renderContent()"><div class="label">本月收入</div><div class="value" style="color:var(--success);">¥4,800</div><div class="sub">可提现 ¥2,500 →</div></div><div class="stat-item"><div class="label">好评率</div><div class="value">98.5%</div><div class="sub" style="color:var(--success);">↑ 0.3%</div></div></div><div style="margin-top:16px;"><div class="ant-card"><div class="ant-card-head">⚡ 快捷操作</div><div class="ant-card-body"><div style="display:flex;gap:16px;flex-wrap:wrap;"><div class="stat-item" onclick="curPage=\'order-mgmt\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--primary);"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">📋</div><div><div style="font-weight:500;">我的订单</div><div style="font-size:var(--font-size-sm);color:var(--primary);">3 单执行中</div></div></div><div class="stat-item" onclick="curPage=\'order-pool\';openGroup=\'order\';renderTree();renderContent()" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--primary);"><div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">📦</div><div><div style="font-weight:500;">接单大厅</div><div style="font-size:var(--font-size-sm);color:var(--primary);">8 单可抢</div></div></div><div class="stat-item" style="display:flex;align-items:center;gap:12px;min-width:200px;border-color:var(--border);opacity:.5;cursor:not-allowed;pointer-events:none;"><div style="width:40px;height:40px;background:var(--bg);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">💳</div><div><div style="font-weight:500;">提现（二期开放）</div><div style="font-size:var(--font-size-sm);color:var(--text-secondary);">可提现 ¥2,500</div></div></div></div></div></div></div>';
  }
  return '';
}

// ── 结算/提现弹窗（全局） ──
function openGuildSettle(){
  var bankBody='<div class="ant-form-item"><div class="ant-form-label">机构名称</div><input class="ant-input" value="三角洲机构A组" readonly style="background:var(--bg);"></div>'+
    '<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>收款银行</div><select class="ant-input"><option value="">请选择开户银行</option><option>中国工商银行</option><option>中国建设银行</option><option>中国农业银行</option><option>中国银行</option><option>招商银行</option><option>交通银行</option><option>邮储银行</option></select></div>'+
    '<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>开户行</div><input class="ant-input" placeholder="如：中国工商银行深圳南山支行"></div>'+
    '<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>收款账户名</div><input class="ant-input" placeholder="对公账户全称"></div>'+
    '<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>收款账号</div><input class="ant-input" placeholder="银行卡号"></div>';
  var alipayBody='<div class="ant-form-item"><div class="ant-form-label">机构名称</div><input class="ant-input" value="三角洲机构A组" readonly style="background:var(--bg);"></div>'+
    '<div style="margin:16px 0;border-top:1px solid var(--border-light);"></div>'+
    '<div style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-bottom:12px;">收款账户（来自个人中心支付宝认证）</div>'+
    '<div class="bind-item" style="margin-bottom:12px;"><div class="bind-info"><div class="bind-label">真实姓名</div><div class="bind-val">'+profile.alipayName+'</div></div></div>'+
    '<div class="bind-item" style="margin-bottom:12px;"><div class="bind-info"><div class="bind-label">身份证号</div><div class="bind-val">'+profile.alipayIdCard+'</div></div></div>'+
    '<div class="bind-item" style="margin-bottom:12px;"><div class="bind-info"><div class="bind-label">支付宝账号</div><div class="bind-val">'+profile.alipayAccount+'</div></div></div>'+
    '<div class="ant-alert">结算款将打入上述支付宝账号，预计 1-3 个工作日到账。</div>';
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>结算金额</div><div style="display:flex;align-items:center;gap:8px;"><input class="ant-input" id="settleAmount" value="8750" style="width:200px;font-size:20px;font-weight:700;color:var(--primary);" placeholder="请输入结算金额"><span style="color:var(--text-secondary);white-space:nowrap;">元</span></div><div style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-top:4px;">可结算金额：¥8,750.00</div></div>'+
    '<div style="border-top:1px solid var(--border-light);margin:16px 0;"></div>'+
    '<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>结算方式</div>'+
    '<div class="ant-tabs" style="margin-bottom:12px;">'+
    '<div class="ant-tab active" id="settle-tab-bank" onclick="document.getElementById(\'settle-bank\').style.display=\'\';document.getElementById(\'settle-alipay\').style.display=\'none\';this.classList.add(\'active\');document.getElementById(\'settle-tab-alipay\').classList.remove(\'active\');">🏦 银行卡结算</div>'+
    '<div class="ant-tab" id="settle-tab-alipay" onclick="document.getElementById(\'settle-alipay\').style.display=\'\';document.getElementById(\'settle-bank\').style.display=\'none\';this.classList.add(\'active\');document.getElementById(\'settle-tab-bank\').classList.remove(\'active\');">💳 支付宝结算</div>'+
    '</div>'+
    '<div id="settle-bank">'+bankBody+'</div>'+
    '<div id="settle-alipay" style="display:none;">'+alipayBody+'</div></div>'+
    '<div class="ant-form-item"><div class="ant-form-label">备注说明</div><textarea class="ant-input" style="min-height:48px;" placeholder="选填"></textarea></div>';
  openModal('🏛️ 机构结算申请',body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="toast(\'结算申请已提交，等待平台审核\');closeModal()">提交申请</button>');
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
    h+='<div class="stat-row"><div class="stat-item"><div class="label">机构账户余额</div><div class="value" style="color:var(--primary);">¥24,880.00</div><div class="sub">可结算金额 ¥8,750.00</div></div><div class="stat-item"><div class="label">待结算金额</div><div class="value" style="color:var(--warning);">¥8,750.00</div><div class="sub">已完成订单 28 笔</div></div><div class="stat-item"><div class="label">本月流水</div><div class="value" style="color:var(--success);">¥32,500</div><div class="sub">较上月 ↑ 18%</div></div><div class="stat-item"><div class="label">累计结算</div><div class="value">¥186,200</div><div class="sub">累计完成 428 单</div></div></div>'+(currentRole==='guild_admin'?'<div style="margin-bottom:16px;"><button class="ant-btn ant-btn-primary" onclick="openGuildSettle()">🏛️ 申请机构结算</button></div>':'')+'';
  }else if(isBooster){
    h+='<div class="stat-row"><div class="stat-item" style="opacity:0.4;"><div class="label">账户余额</div><div class="value" style="color:var(--text-tertiary);">--</div><div class="sub">暂未开放</div></div><div class="stat-item" style="opacity:0.4;"><div class="label">冻结金额</div><div class="value" style="color:var(--text-tertiary);">--</div><div class="sub">暂未开放</div></div><div class="stat-item" style="opacity:0.4;"><div class="label">累计收益</div><div class="value" style="color:var(--text-tertiary);">--</div><div class="sub">暂未开放</div></div><div class="stat-item" style="opacity:0.4;"><div class="label">代练币</div><div class="value" style="color:var(--text-tertiary);">--</div><div class="sub">暂未开放</div></div></div><div style="margin-bottom:16px;"><button class="ant-btn ant-btn-disabled">💳 申请提现（二期开放）</button></div>';
  }else{
    h+='<div class="stat-row"><div class="stat-item"><div class="label">账户余额</div><div class="value" style="color:var(--primary);">¥2,500.00</div><div class="sub">可提现余额</div></div><div class="stat-item"><div class="label">冻结金额</div><div class="value" style="color:var(--warning);">¥1,280.00</div><div class="sub">执行中订单 3 笔</div></div><div class="stat-item"><div class="label">累计收益</div><div class="value" style="color:var(--success);">¥68,500</div><div class="sub">本月 ¥4,800</div></div><div class="stat-item"><div class="label">代练币</div><div class="value">350 M</div><div class="sub">1M = 100W 游戏币</div></div></div><div style="margin-bottom:16px;"><button class="ant-btn ant-btn-disabled">💳 申请提现（二期开放）</button></div>';
  }
  // Flow data tabs
  h+='<div class="filter-bar" style="margin-bottom:12px;"><input class="ant-input" style="width:130px;" id="assetDateFrom" placeholder="开始日期" value="'+assetDateFrom+'"><span style="line-height:32px;margin:0 4px;">-</span><input class="ant-input" style="width:130px;" id="assetDateTo" placeholder="结束日期" value="'+assetDateTo+'"><button class="ant-btn ant-btn-primary ant-btn-sm" onclick="assetDateFrom=document.getElementById(\'assetDateFrom\').value;assetDateTo=document.getElementById(\'assetDateTo\').value;renderContent()">查询</button><button class="ant-btn ant-btn-sm" onclick="exportMyAssetFlow()">导出 CSV</button></div>';
  h+='<div class="ant-card"><div class="ant-card-head">💳 流水数据</div><div class="ant-card-body"><div class="ant-tabs" style="margin-bottom:12px;"><div class="ant-tab'+(curAssetTab==='order'?' active':'')+'" onclick="curAssetTab=\'order\';renderContent()">📋 订单流水</div><div class="ant-tab'+(curAssetTab==='settle'?' active':'')+'" onclick="curAssetTab=\'settle\';renderContent()">💰 '+(isBooster?'提现流水':'结算流水')+'</div></div>';
  if(curAssetTab==='order'){
    // 订单流水
    h+='<div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>时间</th><th>订单ID</th><th>订单类型</th>'+(isBooster?'':'<th>订单来源</th>')+'<th>结算金额</th><th>入账金额</th>'+(isGuild?'<th>代练</th>':'')+'<th>订单备注</th></tr></thead><tbody>';
    var orderFlows;
    if(isGuild){
      orderFlows=[{time:'05-26 14:30',id:'DD202605260015',type:'代练',src:'内部录入',settle:'¥298',income:'¥208',booster:'王代练',note:'跑刀 300万哈夫币'},{time:'05-26 11:15',id:'DD202605260013',type:'代练',src:'外部订单',settle:'¥520',income:'¥0',booster:'刘代练',note:'装备刷取x3'},{time:'05-25 18:30',id:'DD202605250010',type:'代练',src:'内部录入',settle:'¥650',income:'¥455',booster:'陈代练',note:'账号练级1→30'},{time:'05-24 15:20',id:'DD202605240005',type:'陪玩',src:'外部订单',settle:'¥350',income:'¥0',booster:'王代练',note:'排位黄金→铂金'},{time:'05-24 09:00',id:'DD202605240003',type:'代练',src:'内部录入',settle:'¥800',income:'¥560',booster:'赵代练',note:'排位钻石→黑鹰'},{time:'05-23 16:00',id:'DD202605230008',type:'代练',src:'外部订单',settle:'¥300',income:'¥0',booster:'王代练',note:'排位青铜→钻石'}];
    }else if(isBooster){
      orderFlows=[{time:'05-26 14:30',id:'DD202605260015',type:'代练',src:'内部录入',settle:'¥298',income:'¥208',note:'跑刀 300万哈夫币'},{time:'05-26 11:15',id:'DD202605260013',type:'代练',src:'外部订单',settle:'¥520',income:'¥364',note:'装备刷取x3'},{time:'05-25 18:30',id:'DD202605250010',type:'代练',src:'内部录入',settle:'¥650',income:'¥455',note:'账号练级1→30'},{time:'05-24 15:20',id:'DD202605240005',type:'陪玩',src:'外部订单',settle:'¥350',income:'¥245',note:'排位黄金→铂金'},{time:'05-23 16:00',id:'DD202605230008',type:'代练',src:'外部订单',settle:'¥300',income:'¥210',note:'排位青铜→钻石'}];
    }else{
      orderFlows=[{time:'05-26 14:30',id:'DD202605260015',type:'代练',src:'内部录入',settle:'¥298',income:'¥208',note:'跑刀 300万哈夫币'},{time:'05-26 11:15',id:'DD202605260013',type:'代练',src:'外部订单',settle:'¥520',income:'¥364',note:'装备刷取x3'},{time:'05-25 18:30',id:'DD202605250010',type:'代练',src:'内部录入',settle:'¥650',income:'¥455',note:'账号练级1→30'},{time:'05-24 15:20',id:'DD202605240005',type:'陪玩',src:'外部订单',settle:'¥350',income:'¥245',note:'排位黄金→铂金'},{time:'05-23 10:00',id:'DD202605230003',type:'代练',src:'内部录入',settle:'¥200',income:'¥140',note:'任务代打周常'}];
    }
    var displayOrderFlows=orderFlows;
    if(assetDateFrom||assetDateTo){
      displayOrderFlows=orderFlows.filter(function(f){var d=f.time.split(' ')[0];if(assetDateFrom&&d<assetDateFrom)return false;if(assetDateTo&&d>assetDateTo)return false;return true;});
    }
    displayOrderFlows.forEach(function(f){
      h+='<tr><td>'+f.time+'</td><td class="link">'+f.id+'</td><td>'+f.type+'</td>'+(isBooster?'':'<td>'+f.src+'</td>')+'<td style="font-weight:500;">'+f.settle+'</td><td style="color:var(--success);font-weight:500;">'+f.income+'</td>'+(isGuild?'<td>'+(f.booster||'-')+'</td>':'')+'<td>'+f.note+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }else{
    // 结算流水
    h+='<div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>时间</th><th>'+(isBooster?'提现金额':'结算金额')+'</th><th>'+(isBooster?'提现状态':'结算状态')+'</th><th>备注</th></tr></thead><tbody>';
    var settleFlows;
    if(isGuild){
      settleFlows=[{time:'05-25 10:00',amt:'¥12,500',status:'已打款',st:'ant-tag-success',note:'机构结算打款 05月批次'},{time:'04-28 16:20',amt:'¥9,680',status:'已打款',st:'ant-tag-success',note:'机构结算打款 04月批次'},{time:'05-31 18:00',amt:'¥8,750',status:'待打款',st:'ant-tag-warning',note:'待平台审核'},{time:'03-28 14:00',amt:'¥8,200',status:'已打款',st:'ant-tag-success',note:'机构结算打款 03月批次'}];
    }else if(isBooster){
      settleFlows=[{time:'05-25 14:00',amt:'¥3,000',status:'已打款',st:'ant-tag-success',note:'提现到支付宝 138****8888'},{time:'05-23 10:00',amt:'¥2,000',status:'已打款',st:'ant-tag-success',note:'提现到支付宝 138****8888'}];
    }else{
      settleFlows=[{time:'05-25 14:00',amt:'¥3,000',status:'已打款',st:'ant-tag-success',note:'提现到支付宝 138****8888'},{time:'04-28 10:00',amt:'¥2,000',status:'已打款',st:'ant-tag-success',note:'提现到支付宝 138****8888'},{time:'05-30 16:00',amt:'¥2,500',status:'待打款',st:'ant-tag-warning',note:'提现审核中'}];
    }
    var displaySettleFlows=settleFlows;
    if(assetDateFrom||assetDateTo){
      displaySettleFlows=settleFlows.filter(function(f){var d=f.time.split(' ')[0];if(assetDateFrom&&d<assetDateFrom)return false;if(assetDateTo&&d>assetDateTo)return false;return true;});
    }
    displaySettleFlows.forEach(function(f){
      h+='<tr><td>'+f.time+'</td><td style="font-weight:600;">'+f.amt+'</td><td><span class="ant-tag '+f.st+'">'+f.status+'</span></td><td>'+f.note+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }
  h+='</div></div>';
  return h;
}

function exportMyAssetFlow(){
  var rows=[],table=document.querySelector('#content-area .ant-table tbody');
  if(!table)return;
  table.querySelectorAll('tr').forEach(function(tr){var cells=[];tr.querySelectorAll('td').forEach(function(td){cells.push(td.textContent||'');});rows.push(cells);});
  var ths=document.querySelectorAll('#content-area .ant-table thead th');
  var headers=[];
  ths.forEach(function(th){headers.push(th.textContent||'');});
  var prefix=curAssetTab==='order'?'订单流水':'结算流水';
  exportCSV(headers,rows,prefix+'_'+new Date().toISOString().slice(0,10)+'.csv');
}
// ── 平台资产（平台管理员） ──
function rPlatformAssets(){
  var guilds=[
    {name:'三角洲机构A组',admin:'张会长',tel:'138****1111',balance:'¥24,880.00',pending:'¥8,750.00',settled:'¥186,200.00',total:'¥211,080.00',orders:28,members:8,created:'2026-03-15'},
    {name:'三角洲机构B组',admin:'李会长',tel:'139****2222',balance:'¥15,620.00',pending:'¥4,760.00',settled:'¥98,500.00',total:'¥114,120.00',orders:18,members:6,created:'2026-04-01'},
    {name:'三角洲机构C组',admin:'王会长',tel:'137****3333',balance:'¥6,380.00',pending:'¥2,730.00',settled:'¥42,800.00',total:'¥49,180.00',orders:10,members:4,created:'2026-05-10'}
  ];
  var totalBalance=24680+15620+6380;
  var totalPending=8750+4760+2730;
  var totalSettled=186200+98500+42800;
  var totalAssets=totalBalance+totalSettled;
  var totalOrders=28+18+10;
  var totalMembers=8+6+4;

  var h='';
  // Platform flow summary + settlement status cards
  h+='<div style="display:flex;gap:16px;margin-bottom:24px;"><div class="ant-card" style="flex:1;"><div class="ant-card-head">📈 平台流水概览</div><div class="ant-card-body" style="padding:16px;"><div style="display:flex;gap:24px;"><div style="flex:1;text-align:center;padding:16px;background:var(--primary-light);border-radius:var(--radius);"><div style="font-size:24px;font-weight:700;color:var(--primary);">¥52,600</div><div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">本月流水</div></div><div style="flex:1;text-align:center;padding:16px;background:var(--success-light);border-radius:var(--radius);"><div style="font-size:24px;font-weight:700;color:var(--success);">¥16,240</div><div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">本月结算</div></div><div style="flex:1;text-align:center;padding:16px;background:var(--warning-light);border-radius:var(--radius);"><div style="font-size:24px;font-weight:700;color:var(--warning);">¥8,750</div><div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">待打款</div></div><div style="flex:1;text-align:center;padding:16px;background:var(--bg);border-radius:var(--radius);"><div style="font-size:24px;font-weight:700;color:var(--text);">¥98,200</div><div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">平台收入</div></div></div></div></div><div class="ant-card" style="flex:1;"><div class="ant-card-head">💰 结算状态分布</div><div class="ant-card-body" style="padding:16px;"><div style="display:flex;gap:16px;"><div style="flex:1;text-align:center;padding:12px;border:1px solid var(--border-light);border-radius:var(--radius);"><div style="font-size:20px;font-weight:600;color:var(--primary);">128</div><div style="font-size:12px;color:var(--text-secondary);">已完成订单</div></div><div style="flex:1;text-align:center;padding:12px;border:1px solid var(--border-light);border-radius:var(--radius);"><div style="font-size:20px;font-weight:600;color:var(--warning);">28</div><div style="font-size:12px;color:var(--text-secondary);">待结算订单</div></div><div style="flex:1;text-align:center;padding:12px;border:1px solid var(--border-light);border-radius:var(--radius);"><div style="font-size:20px;font-weight:600;color:var(--success);">5</div><div style="font-size:12px;color:var(--text-secondary);">已打款笔数</div></div><div style="flex:1;text-align:center;padding:12px;border:1px solid var(--border-light);border-radius:var(--radius);"><div style="font-size:20px;font-weight:600;color:var(--danger);">2</div><div style="font-size:12px;color:var(--text-secondary);">待打款笔数</div></div></div></div></div></div>';

  // Top stat cards
  h+='<div class="stat-row"><div class="stat-item"><div class="label">平台总资产</div><div class="value" style="color:var(--primary);">¥'+totalAssets.toLocaleString()+'.00</div></div><div class="stat-item"><div class="label">机构余额合计</div><div class="value" style="color:var(--success);">¥'+totalBalance.toLocaleString()+'.00</div></div><div class="stat-item"><div class="label">待结算总额</div><div class="value" style="color:var(--warning);">¥'+totalPending.toLocaleString()+'.00</div></div><div class="stat-item"><div class="label">已结算总额</div><div class="value">¥'+totalSettled.toLocaleString()+'.00</div></div></div>';

  // Guild asset table
  h+='<div class="ant-card"><div class="ant-card-head">🏛️ 机构资产明细</div><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>机构名称</th><th>管理员</th><th>联系方式</th><th>资产余额</th><th>待结算</th><th>已结算</th><th>总资产</th><th>执行中订单</th><th>代练人数</th><th>创建时间</th><th>操作</th></tr></thead><tbody>';
  guilds.forEach(function(g,i){
    h+='<tr><td style="font-weight:500;"><span class="ant-tag ant-tag-purple">'+g.name+'</span></td><td>'+g.admin+'</td><td>'+g.tel+'</td><td style="font-weight:600;color:var(--success);">'+g.balance+'</td><td style="font-weight:600;color:var(--warning);">'+g.pending+'</td><td>'+g.settled+'</td><td style="font-weight:600;">'+g.total+'</td><td>'+g.orders+'</td><td>'+g.members+'</td><td>'+g.created+'</td><td><button class="ant-btn ant-btn-sm" onclick="event.stopPropagation();openGuildDetail('+i+')">查看明细</button></td></tr>';
  });
  h+='</tbody></table></div></div></div>';

  return h;
}

// ── 机构明细弹窗 ──
function openGuildDetail(idx){
  guildDetailIdx=idx;
  guildDetailCurTab='order';
  guildDetailOrderPage=1;
  guildDetailSettlePage=1;
  renderGuildDetailModal();
}

function switchGuildDetailTab(tab){
  guildDetailCurTab=tab;
  renderGuildDetailModal();
}

function switchGuildDetailPage(page){
  if(guildDetailCurTab==='order') guildDetailOrderPage=page;
  else guildDetailSettlePage=page;
  renderGuildDetailModal();
}

function renderGuildDetailModal(){
  var pageSize=10;
  var guilds=[
    {name:'三角洲机构A组',admin:'张会长',tel:'138****1111',balance:'¥24,880.00',pending:'¥8,750.00',settled:'¥186,200.00',total:'¥211,080.00'},
    {name:'三角洲机构B组',admin:'李会长',tel:'139****2222',balance:'¥15,620.00',pending:'¥4,760.00',settled:'¥98,500.00',total:'¥114,120.00'},
    {name:'三角洲机构C组',admin:'王会长',tel:'137****3333',balance:'¥6,380.00',pending:'¥2,730.00',settled:'¥42,800.00',total:'¥49,180.00'}
  ];
  var g=guilds[guildDetailIdx];
  // Mock orders
  var orders=[
    {id:'DD202605310025',title:'排位青铜→钻石',type:'代练',amt:'¥298',status:'执行中',booster:'赵代练',time:'05-31 15:30'},
    {id:'DD202605300018',title:'任务代打日常',type:'代练',amt:'¥120',status:'已完成',booster:'钱代练',time:'05-30 12:00'},
    {id:'DD202605290012',title:'账号练级1→30',type:'代练',amt:'¥650',status:'已结算',booster:'孙代练',time:'05-29 10:15'},
    {id:'DD202605280008',title:'装备刷取x3',type:'代练',amt:'¥520',status:'已结算',booster:'李代练',time:'05-28 16:30'},
    {id:'DD202605270005',title:'排位黄金→铂金',type:'代练',amt:'¥350',status:'已结算',booster:'周代练',time:'05-27 14:00'},
    {id:'DD202605260025',title:'任务代打周常',type:'代练',amt:'¥200',status:'已结算',booster:'吴代练',time:'05-26 09:30'},
    {id:'DD202605250020',title:'排位钻石→黑鹰',type:'代练',amt:'¥800',status:'已结算',booster:'郑代练',time:'05-25 11:00'},
    {id:'DD202605240015',title:'装备强化+10',type:'代练',amt:'¥450',status:'执行中',booster:'王代练',time:'05-24 14:20'},
    {id:'DD202605230010',title:'账号练级30→50',type:'代练',amt:'¥980',status:'已完成',booster:'赵代练',time:'05-23 16:45'},
    {id:'DD202605220008',title:'排位铂金→钻石',type:'代练',amt:'¥420',status:'已结算',booster:'钱代练',time:'05-22 10:10'},
    {id:'DD202605210005',title:'跑刀 300万哈夫币',type:'代练',amt:'¥180',status:'已结算',booster:'孙代练',time:'05-21 13:30'},
    {id:'DD202605200012',title:'任务代打日常x5',type:'代练',amt:'¥600',status:'已结算',booster:'李代练',time:'05-20 15:00'},
    {id:'DD202605190018',title:'排位青铜→黄金',type:'代练',amt:'¥250',status:'执行中',booster:'周代练',time:'05-19 08:45'},
    {id:'DD202605180022',title:'装备刷取x5',type:'陪玩',amt:'¥880',status:'已结算',booster:'吴代练',time:'05-18 12:20'},
    {id:'DD202605170015',title:'账号练级1→20',type:'代练',amt:'¥350',status:'已结算',booster:'郑代练',time:'05-17 17:00'}
  ];
  // Mock settlements
  var settlements=[
    {period:'2026-05-21 ~ 2026-05-31',amt:'¥8,750.00',status:'待打款',applyTime:'05-31 18:00',bank:'招商银行 6222****8888'},
    {period:'2026-05-11 ~ 2026-05-20',amt:'¥12,400.00',status:'已打款',applyTime:'05-21 10:30',bank:'工商银行 6217****6666'},
    {period:'2026-05-01 ~ 2026-05-10',amt:'¥9,680.00',status:'已打款',applyTime:'05-11 14:00',bank:'建设银行 6227****9999'},
    {period:'2026-04-21 ~ 2026-04-30',amt:'¥11,200.00',status:'已打款',applyTime:'05-01 09:00',bank:'招商银行 6222****8888'},
    {period:'2026-04-11 ~ 2026-04-20',amt:'¥7,850.00',status:'已打款',applyTime:'04-21 16:30',bank:'工商银行 6217****6666'},
    {period:'2026-04-01 ~ 2026-04-10',amt:'¥10,300.00',status:'已打款',applyTime:'04-11 11:00',bank:'建设银行 6227****9999'},
    {period:'2026-03-21 ~ 2026-03-31',amt:'¥8,900.00',status:'已打款',applyTime:'04-01 14:20',bank:'招商银行 6222****8888'},
    {period:'2026-03-11 ~ 2026-03-20',amt:'¥6,720.00',status:'已打款',applyTime:'03-21 10:15',bank:'工商银行 6217****6666'},
    {period:'2026-03-01 ~ 2026-03-10',amt:'¥9,150.00',status:'已打款',applyTime:'03-11 15:45',bank:'建设银行 6227****9999'},
    {period:'2026-02-21 ~ 2026-02-28',amt:'¥7,380.00',status:'已打款',applyTime:'03-01 09:30',bank:'招商银行 6222****8888'},
    {period:'2026-02-11 ~ 2026-02-20',amt:'¥10,800.00',status:'已打款',applyTime:'02-21 12:00',bank:'工商银行 6217****6666'},
    {period:'2026-02-01 ~ 2026-02-10',amt:'¥5,940.00',status:'已打款',applyTime:'02-11 16:00',bank:'建设银行 6227****9999'}
  ];

  var isOrder=guildDetailCurTab==='order';
  var data=isOrder?orders:settlements;
  var curPage=isOrder?guildDetailOrderPage:guildDetailSettlePage;
  var totalPages=Math.ceil(data.length/pageSize);
  if(curPage>totalPages)curPage=totalPages;
  var start=(curPage-1)*pageSize;
  var pageData=data.slice(start,start+pageSize);

  var h='<div style="margin-bottom:20px;"><div style="font-weight:600;font-size:14px;margin-bottom:4px;">'+g.name+'</div><div style="font-size:12px;color:var(--text-secondary);">管理员：'+g.admin+' | 联系方式：'+g.tel+' | 余额：'+g.balance+' | 待结算：'+g.pending+' | 已结算：'+g.settled+' | 总资产：'+g.total+'</div></div>';

  // Tabs
  h+='<div class="ant-tabs" style="margin-bottom:12px;"><div class="ant-tab'+(isOrder?' active':'')+'" onclick="switchGuildDetailTab(\'order\')">📋 订单明细</div><div class="ant-tab'+(!isOrder?' active':'')+'" onclick="switchGuildDetailTab(\'settle\')">💰 结算明细</div></div>';

  if(isOrder){
    // Order table
    h+='<div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>订单编号</th><th>订单标题</th><th>类型</th><th>金额</th><th>状态</th><th>代练</th><th>创建时间</th></tr></thead><tbody>';
    pageData.forEach(function(o){
      var sc='';if(o.status==='已结算')sc='color:var(--success);';else if(o.status==='执行中')sc='color:var(--primary);';
      h+='<tr><td class="link">'+o.id+'</td><td>'+o.title+'</td><td>'+o.type+'</td><td style="font-weight:500;">'+o.amt+'</td><td style="'+sc+'font-weight:500;">'+o.status+'</td><td>'+o.booster+'</td><td>'+o.time+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }else{
    // Settlement table
    h+='<div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>结算周期</th><th>结算金额</th><th>状态</th><th>发起时间</th><th>收款账户</th></tr></thead><tbody>';
    pageData.forEach(function(s){
      var sc2='';if(s.status==='已打款')sc2='color:var(--success);';else if(s.status==='待打款')sc2='color:var(--warning);';
      h+='<tr><td>'+s.period+'</td><td style="font-weight:600;">'+s.amt+'</td><td style="'+sc2+'font-weight:500;">'+s.status+'</td><td>'+s.applyTime+'</td><td>'+s.bank+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }

  // Pagination
  h+='<div class="ant-pagination" style="margin-top:12px;"><span class="total">共 '+data.length+' 条</span><div>';
  for(var p=1;p<=totalPages;p++){
    h+='<span class="page-btn'+(p===curPage?' active':'')+'" onclick="switchGuildDetailPage('+p+')">'+p+'</span>';
  }
  h+='</div></div>';

  openModal('🏛️ 机构资产明细 - '+g.name,h,'<button class="ant-btn ant-btn-primary" onclick="closeModal()">关闭</button>');
  document.getElementById('modal-box').classList.add('wider');
}

// ── 订单录入 ──
function rOrderEntry(){return'<div style="display:flex;gap:16px;align-items:flex-start;height:calc(100vh - 130px);"><div style="width:240px;flex-shrink:0;display:flex;flex-direction:column;gap:12px;height:100%;"><div class="ant-card" style="border:2px solid var(--primary);flex:2;display:flex;flex-direction:column;"><div class="ant-card-head" style="background:var(--primary-light);padding:8px 14px;min-height:34px;font-size:13px;">📋 订单内容自动识别</div><div class="ant-card-body" style="padding:10px;flex:1;display:flex;flex-direction:column;"><textarea class="ant-input" style="flex:1;min-height:0;resize:none;font-size:12px;" placeholder="粘贴微信/QQ聊天记录或订单文本&#10;系统自动识别关键字段&#10;&#10;例：&#10;游戏：三角洲行动 端游&#10;区服：QQ&#10;段位：青铜→钻石&#10;价格：298元"></textarea><button class="ant-btn ant-btn-primary ant-btn-sm" style="width:100%;margin-top:8px;height:28px;" onclick="toast(\'✓ 已识别订单内容\')">🔍 识别订单</button></div></div><div class="ant-card" style="flex:1;"><div class="ant-card-head" style="padding:8px 14px;min-height:34px;font-size:13px;">🖼️ 群聊截图</div><div class="ant-card-body" style="padding:10px;"><div class="upload-area" style="padding:10px;font-size:12px;min-height:60px;display:flex;align-items:center;justify-content:center;">点击或拖拽上传截图</div></div></div></div><div style="flex:1;display:flex;flex-direction:column;gap:12px;min-width:0;height:100%;overflow-y:auto;"><div class="ant-card" style="flex:1;"><div class="ant-card-head" style="padding:8px 16px;min-height:34px;font-size:13px;">📝 信息录入</div><div class="ant-card-body" style="padding:16px;"><div class="ant-row"><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>选择游戏</div><select class="ant-input"><option>三角洲行动端游</option><option>三角洲行动手游</option></select></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;">选择平台</div><select class="ant-input"><option>WeGame</option><option>Steam</option></select></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>选择区服</div><select class="ant-input"><option>QQ账号</option><option>微信账号</option></select></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;">角色名称</div><input class="ant-input" placeholder="游戏内角色名"></div></div><div class="ant-row"><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>订单类型</div><select class="ant-input"><option>代练</option><option>陪玩</option></select></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>上号方式</div><select class="ant-input"><option>扫码登录</option><option>账号密码登录</option></select></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>服务类型</div><select class="ant-input"><option>跑刀</option></select></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>服务规格</div><input class="ant-input" id="svc-spec" placeholder="如：300万哈夫币"></div></div><div class="ant-row"><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>商品标题</div><input class="ant-input" placeholder="服务类型+游戏角色名称"></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>商品信息</div><input class="ant-input" placeholder="服务类型+游戏角色名称"></div></div><div class="ant-row"><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>选择订单来源</div><select class="ant-input"><option>内部录入</option><option>外部订单</option></select></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;">订单来源编号</div><input class="ant-input" placeholder="来源平台订单号"></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;">用户手机号</div><input class="ant-input" placeholder="客户手机号"></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;">订单备注</div><input class="ant-input" placeholder="备注信息"></div></div><div class="ant-row"><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>用户支付金额(元)</div><input class="ant-input" placeholder="客户实际支付" type="number"></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>订单录入金额(元)</div><input class="ant-input" placeholder="系统录入金额" type="number"></div><div class="ant-form-item" style="margin-bottom:14px;opacity:0.4;"><div class="ant-form-label" style="margin-bottom:4px;">预计利润(元) <span style="font-size:11px;">(二期)</span></div><input class="ant-input" value="--" disabled style="background:#f5f5f5;"></div><div class="ant-form-item" style="margin-bottom:14px;"><div class="ant-form-label" style="margin-bottom:4px;">指派客服</div><select class="ant-input"><option>请选择</option><option>小李</option><option>小周</option></select></div></div><div class="ant-row"><div class="ant-form-item" style="margin-bottom:0;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>接单方式</div><select class="ant-input" id="order-dispatch" onchange="var v=this.value;var s2=document.getElementById(\'slot2\');if(v===\'开放接单\'){s2.style.display=\'none\';}else if(v===\'指派代练\'){s2.style.display=\'\';s2.querySelector(\'.ant-form-label\').innerHTML=\'<span class=req>*</span>选择代练\';s2.querySelector(\'select\').innerHTML=\'<option>请选择代练</option><option>王代练（wang_dl）</option><option>陈代练（chen_dl）</option><option>赵代练（zhao_dl）</option><option>孙代练（sun_dl）</option>\';}else if(v===\'指派机构\'){s2.style.display=\'\';s2.querySelector(\'.ant-form-label\').innerHTML=\'<span class=req>*</span>选择机构\';s2.querySelector(\'select\').innerHTML=\'<option>请选择</option><option>三角洲机构A组</option><option>三角洲机构B组</option><option>三角洲机构C组</option>\';}"><option>开放接单</option><option>指派代练</option><option>指派机构</option></select></div><div class="ant-form-item" id="slot2" style="margin-bottom:0;display:none;"><div class="ant-form-label" style="margin-bottom:4px;"><span class="req">*</span>选择代练</div><select class="ant-input"><option>请选择代练</option><option>王代练（wang_dl）</option><option>陈代练（chen_dl）</option><option>赵代练（zhao_dl）</option><option>孙代练（sun_dl）</option></select></div></div></div></div><div style="display:flex;justify-content:flex-end;gap:8px;"><button class="ant-btn ant-btn-primary" onclick="toast(\'✓ 订单发布成功\');curPage=\'order-mgmt\';openGroup=\'order\';renderTree();renderContent()">📤 发布订单</button></div></div></div>';}

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

// ── 驳回订单弹窗（客服审核驳回）──
function openRejectOrder(oid){
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>驳回原因</div>'+
    '<textarea class="ant-input" id="reject-reason" style="min-height:80px;" placeholder="请填写驳回原因"></textarea></div>';
  openModal('❌ 驳回订单 - '+oid,body,
    '<button class="ant-btn" onclick="closeModal()">取消</button>'+
    '<button class="ant-btn ant-btn-danger" onclick="var reason=document.getElementById(\'reject-reason\').value.trim();if(!reason){toast(\'请填写驳回原因\');return;}closeModal();toast(\'✓ 订单已驳回：\'+reason)">确认驳回</button>');
}

// ── 验收退回弹窗（客服验收退回）──
function openRejectVerify(oid){
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>退回原因</div>'+
    '<textarea class="ant-input" id="reject-verify-reason" style="min-height:80px;" placeholder="请填写退回原因"></textarea></div>';
  openModal('↩️ 退回订单 - '+oid,body,
    '<button class="ant-btn" onclick="closeModal()">取消</button>'+
    '<button class="ant-btn ant-btn-danger" onclick="var reason=document.getElementById(\'reject-verify-reason\').value.trim();if(!reason){toast(\'请填写退回原因\');return;}closeModal();toast(\'✓ 订单已退回：\'+reason)">确认退回</button>');
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

// ── 重新录入弹窗（已关单订单）──
function openReEnterOrder(oid){
  var body='<div style="text-align:center;padding:8px 0;"><div style="font-size:15px;margin-bottom:8px;">确认重新录入该订单？</div><div style="color:var(--text-secondary);font-size:13px;">订单 <b>'+oid+'</b> 的所有信息将带入录入页面</div></div>';
  openModal('🔄 重新录入 - '+oid,body,
    '<button class="ant-btn" onclick="closeModal()">取消</button>'+
    '<button class="ant-btn ant-btn-primary" onclick="closeModal();curPage=\'order-entry\';openGroup=\'order\';renderTree();renderContent();toast(\'✓ 已带入订单 '+oid+' 的全部信息\')">确认重新录入</button>');
}

// ── 订单管理 ──
function rOrderMgmt(){
  var statusTabs=['全部','待审核','待指派','执行中','待验收','待结算','已暂停','已完成','已关单'];
  var orders=[
    {id:'DD202605260012',title:'排位青铜→钻石',status:'待审核',st:'ant-tag-default',prog:'-',asset:'-',booster:'-',settle:'¥298',amt:'¥298',dep:'¥0',cs:'-',src:'内部录入',studio:'-',contact:'138****8888',type:'代练',game:'三角洲',zone:'QQ',role:'玩家A',time:'05-26 14:30',guild:'-'},
    {id:'DD202605260011',title:'任务代打日常全清',status:'执行中',st:'ant-tag-primary',prog:'6/10',asset:'6M/10M',booster:'王代练',settle:'¥105',amt:'¥150',dep:'¥30',cs:'小李',src:'外部订单',studio:'外部',contact:'137****6666',type:'代练',game:'三角洲',zone:'QQ',role:'玩家B',time:'05-26 13:20',guild:'三角洲机构A组'},
    {id:'DD202605260010',title:'装备刷取x3',status:'待验收',st:'ant-tag-warning',prog:'2/3',asset:'4M/5M',booster:'刘代练',settle:'¥312',amt:'¥520',dep:'¥100',cs:'小李',src:'内部录入',studio:'-',contact:'136****0001',type:'代练',game:'三角洲',zone:'QQ',role:'玩家C',time:'05-26 11:15',guild:'-'},
    {id:'DD202605260009',title:'账号练级1→30',status:'待指派',st:'ant-tag-primary',prog:'-',asset:'-',booster:'-',settle:'¥650',amt:'¥650',dep:'¥130',cs:'小周',src:'外部订单',studio:'外部',contact:'135****0002',type:'代练',game:'三角洲',zone:'微信',role:'玩家D',time:'05-26 10:00',guild:'-'},
    {id:'DD202605250015',title:'排位黄金→铂金',status:'待结算',st:'ant-tag-danger',prog:'100%',asset:'5M',booster:'陈代练',settle:'¥245',amt:'¥350',dep:'¥70',cs:'小李',src:'外部订单',studio:'外部',contact:'134****0003',type:'代练',game:'三角洲',zone:'QQ',role:'玩家E',time:'05-25 16:30',guild:'三角洲机构A组'},
    {id:'DD202605250010',title:'任务代打周常',status:'待审核',st:'ant-tag-default',prog:'-',asset:'-',booster:'-',settle:'¥120',amt:'¥120',dep:'¥24',cs:'小李',src:'内部录入',studio:'-',contact:'133****0004',type:'代练',game:'三角洲',zone:'QQ',role:'玩家F',time:'05-25 14:00',guild:'-'},
    {id:'DD202605240020',title:'排位钻石→黑鹰',status:'执行中',st:'ant-tag-primary',prog:'30%',asset:'2M/12M',booster:'赵代练',settle:'¥560',amt:'¥800',dep:'¥160',cs:'小周',src:'外部订单',studio:'外部',contact:'131****0005',type:'代练',game:'三角洲',zone:'QQ',role:'玩家G',time:'05-24 09:00',guild:'三角洲机构B组'},
    {id:'DD202605240015',title:'装备刷取全套',status:'已关单',st:'ant-tag-default',prog:'-',asset:'-',booster:'-',settle:'-',amt:'¥1,200',dep:'¥0',cs:'小周',src:'内部录入',studio:'-',contact:'139****0006',type:'代练',game:'三角洲',zone:'微信',role:'玩家H',time:'05-24 08:00',guild:'-'},
    {id:'DD202605230008',title:'排位青铜→钻石',status:'执行中',st:'ant-tag-primary',prog:'80%',asset:'12M/15M',booster:'刘代练',settle:'¥210',amt:'¥300',dep:'¥60',cs:'小李',src:'内部录入',studio:'-',contact:'137****0007',type:'代练',game:'三角洲',zone:'QQ',role:'玩家I',time:'05-23 16:00',guild:'-'},
    {id:'DD202605220005',title:'账号练级10→50',status:'已完成',st:'ant-tag-success',prog:'100%',asset:'50M',booster:'孙代练',settle:'¥686',amt:'¥980',dep:'¥196',cs:'小李',src:'内部录入',studio:'-',contact:'136****0008',type:'代练',game:'三角洲',zone:'QQ',role:'玩家J',time:'05-22 08:30',guild:'三角洲机构B组'},
    {id:'DD202605200003',title:'排位白银→黄金',status:'已暂停',st:'ant-tag-danger',prog:'45%',asset:'3M/7M',booster:'赵代练',settle:'-',amt:'¥180',dep:'¥36',cs:'小周',src:'外部订单',studio:'外部',contact:'132****0009',type:'代练',game:'三角洲',zone:'微信',role:'玩家K',time:'05-20 15:00',guild:'-'}
  ];
  var filtered=curTab==='全部'?orders:orders.filter(function(r){return r.status===curTab;});
  // 角色数据过滤：机构只看本机构数据，代练只看自己的数据
  var uGuild=currentUserGuild(),uName=currentBoosterName();
  if(uGuild) filtered=filtered.filter(function(r){return r.guild===uGuild;});
  if(uName) filtered=filtered.filter(function(r){return r.booster===uName;});
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
  h+='<div class="filter-panel" id="filter-panel"><div class="ant-row"><div class="ant-form-item" style="margin-bottom:0;"><div class="ant-form-label" style="margin-bottom:4px;">创建时间</div><div style="display:flex;gap:8px;"><input class="ant-input" style="width:120px;" placeholder="开始日期"><span style="line-height:32px;">-</span><input class="ant-input" style="width:120px;" placeholder="结束日期"></div></div><div class="ant-form-item" style="margin-bottom:0;"><div class="ant-form-label" style="margin-bottom:4px;">订单编号</div><input class="ant-input" placeholder="订单编号"></div><div class="ant-form-item" style="margin-bottom:0;"><div class="ant-form-label" style="margin-bottom:4px;">订单类型</div><select class="ant-input"><option>全部</option><option>代练</option><option>陪玩</option></select></div></div><div class="ant-row" style="margin-top:12px;"><div class="ant-form-item" style="margin-bottom:0;"><div class="ant-form-label" style="margin-bottom:4px;">当前机构</div><select class="ant-input"><option>全部</option><option>三角洲机构A组</option><option>三角洲机构B组</option></select></div><div class="ant-form-item" style="margin-bottom:0;"><div class="ant-form-label" style="margin-bottom:4px;">当前代练</div><select class="ant-input"><option>全部</option><option>王代练</option><option>刘代练</option><option>陈代练</option><option>赵代练</option><option>孙代练</option></select></div><div class="ant-form-item" style="margin-bottom:0;"><div class="ant-form-label" style="margin-bottom:4px;">当前客服</div><select class="ant-input"><option>全部</option><option>小李</option><option>小周</option></select></div></div><div style="display:flex;gap:8px;margin-top:12px;"><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">重置</button></div></div>';
  // Table
  h+='<div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th class="sticky-col">操作</th><th>订单编号</th><th>订单标题</th><th>订单状态</th><th>当前代练</th><th>所属机构</th><th>创建时间</th><th>价格</th><th>结算</th><th>客服</th><th>来源</th><th>联系方式</th><th>类型</th><th>游戏</th><th>区服</th><th>角色</th></tr></thead><tbody>';
  filtered.forEach(function(r){
    var ops='';
    var baseOps='<button class="ant-btn ant-btn-sm" onclick="showOrderDetail(\''+r.id+'\')">查看详情</button>';
    if(r.status==='待审核'){var reviewBtns=canReview()?' <button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'✓ 审核通过\')">通过</button> <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="openRejectOrder(\''+r.id+'\')">驳回</button>':'';var pb1=canManage()?' <button class="ant-btn ant-btn-sm" onclick="openPauseOrder(\''+r.id+'\')">暂停</button>':'';ops=baseOps+reviewBtns+pb1;}
    else if(r.status==='待指派'){var assignBtns=canOperate()?' <button class="ant-btn ant-btn-primary ant-btn-sm" onclick="toast(\'✓ 已指派\')">指派</button>':'';var pb2=canManage()?' <button class="ant-btn ant-btn-sm" onclick="openPauseOrder(\''+r.id+'\')">暂停</button>':'';ops=baseOps+assignBtns+pb2;}
    else if(r.status==='执行中'){var adminOps='';if(canOperate()){adminOps=' <button class="ant-btn ant-btn-success ant-btn-sm" onclick="openCompleteOrder(\''+r.id+'\')">完成</button>';}if(canManage()){adminOps+=' <button class="ant-btn ant-btn-sm" onclick="openPauseOrder(\''+r.id+'\')">暂停</button>';}ops=baseOps+adminOps;}
    else if(r.status==='待验收'){var verifyBtns=canVerify()?' <button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'✓ 验收通过\')">验收</button> <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="openRejectVerify(\''+r.id+'\')">退回</button>':'';var pb3=canManage()?' <button class="ant-btn ant-btn-sm" onclick="openPauseOrder(\''+r.id+'\')">暂停</button>':'';ops=baseOps+verifyBtns+pb3;}
    else if(r.status==='待结算'){var settleBtns=canSettle()?' <button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'✓ 确认结算\')">结算</button>':'';var pb4=canManage()?' <button class="ant-btn ant-btn-sm" onclick="openPauseOrder(\''+r.id+'\')">暂停</button>':'';ops=baseOps+settleBtns+pb4;}
    else if(r.status==='已暂停'){var po='';if(canManage()){po+=' <button class="ant-btn ant-btn-sm" onclick="toast(\'✓ 订单已恢复\')">恢复订单</button>';po+=' <button class="ant-btn ant-btn-sm" onclick="toast(\'✓ 更换代练成功\')">更换代练</button>';po+=' <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="openCancelOrder(\''+r.id+'\')">取消订单</button>';}ops=baseOps+po;}
    else if(r.status==='已完成') ops=baseOps+' <span style="color:var(--text-secondary);">已完结</span>';
    else if(r.status==='已关单'){var reEnter='';if(canReEnter()){reEnter=' <button class="ant-btn ant-btn-primary ant-btn-sm" onclick="openReEnterOrder(\''+r.id+'\')">重新录入</button>';}ops=baseOps+reEnter;}
    h+='<tr class="clickable"><td class="sticky-col" style="white-space:nowrap;">'+ops+'</td><td class="link">'+r.id+'</td><td>'+r.title+'</td><td><span class="ant-tag '+r.st+'">'+r.status+'</span></td><td>'+r.booster+'</td><td>'+(r.guild==='-'?'-':'<span class="ant-tag ant-tag-purple">'+r.guild+'</span>')+'</td><td>'+r.time+'</td><td>'+r.amt+'</td><td>'+r.settle+'</td><td>'+r.cs+'</td><td>'+r.src+'</td><td>'+r.contact+'</td><td>'+r.type+'</td><td>'+r.game+'</td><td>'+r.zone+'</td><td>'+r.role+'</td></tr>';
  });
  h+='</tbody></table></div></div></div><div class="ant-pagination"><span class="total">共 '+filtered.length+' 条</span><div><span class="page-btn active">1</span><span class="page-btn">2</span></div></div>';
  return h;
}

// ── 订单池 ──
function doGrab(rid,rtitle,ramt){
  var isBooster=currentRole==='booster';
  var isPlatform=currentRole==='admin'||currentRole==='operator';
  var confirmBody='<div style="text-align:center;padding:8px 0;"><div style="font-size:16px;font-weight:600;margin-bottom:12px;">确认抢单</div><div class="ant-card" style="background:var(--bg);"><div class="ant-card-body" style="padding:16px;"><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:var(--text-secondary);">订单编号</span><span style="font-weight:500;">'+rid+'</span></div><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:var(--text-secondary);">订单标题</span><span>'+rtitle+'</span></div><div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">订单金额</span><span style="font-weight:600;">'+ramt+'</span></div></div></div></div>';
  if(isBooster){
    openModal('📦 抢单确认',confirmBody,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="closeModal();grabCounter++;if(grabCounter%2===1){toast(\'✓ 抢单成功，订单已进入我的订单\')}else{toast(\'⚠ 该订单已被其他用户抢单，请刷新页面\',\'已被其他用户抢单\')}">确认抢单</button>');
  }else if(isPlatform){
    confirmBody+='<div style="margin-top:12px;"><div class="ant-form-label"><span class="req">*</span>指派机构</div><select class="ant-input" id="grab-assign-guild"><option>请选择机构</option><option>三角洲机构A组</option><option>三角洲机构B组</option><option>三角洲机构C组</option></select></div><div style="margin-top:12px;"><div class="ant-form-label"><span class="req">*</span>指派代练</div><select class="ant-input" id="grab-assign-booster"><option>请选择代练</option><option>王代练（wang_dl）</option><option>陈代练（chen_dl）</option><option>赵代练（zhao_dl）</option><option>孙代练（sun_dl）</option></select></div>';
    openModal('📦 抢单并分配',confirmBody,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="var g=document.getElementById(\'grab-assign-guild\').value;var b=document.getElementById(\'grab-assign-booster\').value;closeModal();if(g===\'请选择机构\'){toast(\'请先选择机构\');return;}if(b===\'请选择代练\'){toast(\'请先选择代练\');return;}grabCounter++;if(grabCounter%2===1){toast(\'✓ 抢单成功，已分配给 \'+g+\' - \'+b)}else{toast(\'⚠ 该订单已被其他用户抢单，请刷新页面\',\'已被其他用户抢单\')}">确认抢单并分配</button>');
  }else{
    confirmBody+='<div style="margin-top:12px;"><div class="ant-form-label"><span class="req">*</span>分配代练</div><select class="ant-input" id="grab-assign-booster"><option>请选择代练</option><option>王代练（wang_dl）</option><option>陈代练（chen_dl）</option><option>赵代练（zhao_dl）</option><option>孙代练（sun_dl）</option></select></div>';
    openModal('📦 抢单并分配',confirmBody,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="var b=document.getElementById(\'grab-assign-booster\').value;closeModal();if(b===\'请选择代练\'){toast(\'请先选择代练\');return;}grabCounter++;if(grabCounter%2===1){toast(\'✓ 抢单成功，已分配给 \'+b)}else{toast(\'⚠ 该订单已被其他用户抢单，请刷新页面\',\'已被其他用户抢单\')}">确认抢单并分配</button>');
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
  var reportH='<div class="ant-card"><div class="ant-card-head">📋 订单报表</div><div class="ant-card-body"><div class="filter-bar"><input class="ant-input" style="width:120px;" placeholder="开始日期"> <span style="line-height:32px;">-</span> <input class="ant-input" style="width:120px;" placeholder="结束日期"><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">导出汇总</button><button class="ant-btn ant-btn-sm">导出按日明细</button></div><div class="ant-tabs"><div class="ant-tab'+(curSubTab==='按日统计'?' active':'')+'" onclick="curSubTab=\'按日统计\';renderContent()">按日统计</div><div class="ant-tab'+(curSubTab==='代练排行榜'?' active':'')+'" onclick="curSubTab=\'代练排行榜\';renderContent()">代练排行榜</div></div>';
  if(curSubTab==='按日统计'){
    reportH+='<div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>日期</th><th>订单数量</th><th>订单总金额</th><th>完成订单数</th><th>完成金额</th></tr></thead><tbody>';
    dailyRows.forEach(function(r){reportH+='<tr><td style="font-weight:500;">'+r.date+'</td><td>'+r.cnt+'</td><td>'+r.amt+'</td><td>'+r.done+'</td><td>'+r.doneAmt+'</td></tr>';});
    reportH+='</tbody></table></div>';
  }else{
    reportH+='<div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>排名</th><th>代练</th><th>完成订单数</th><th>完成金额</th></tr></thead><tbody>';
    rankRows.forEach(function(r){var medal=r.rank===1?'🥇':r.rank===2?'🥈':r.rank===3?'🥉':'';reportH+='<tr><td>'+medal+' '+r.rank+'</td><td style="font-weight:500;">'+r.booster+'</td><td>'+r.done+'</td><td>'+r.amt+'</td></tr>';});
    reportH+='</tbody></table></div>';
  }
  reportH+='</div></div>';
  return ''+(isGuild?'<div class="stat-row"><div class="stat-item"><div class="label">今日机构订单</div><div class="value">18</div><div class="sub">当前执行中的机构订单</div></div><div class="stat-item"><div class="label">今日机构完成</div><div class="value" style="color:var(--success);">3</div><div class="sub">今日结束的机构订单</div></div><div class="stat-item"><div class="label">今日机构录入</div><div class="value" style="color:var(--primary);">4</div><div class="sub">今天新录入的机构订单</div></div><div class="stat-item"><div class="label">机构总订单</div><div class="value" style="color:var(--warning);">22</div><div class="sub">执行中 + 待指派</div></div></div><div class="stat-row"><div class="stat-item"><div class="label">本月机构订单</div><div class="value">186</div><div class="sub" style="color:var(--success);">较上月 ↑ 8%</div></div><div class="stat-item"><div class="label">本月机构完成</div><div class="value" style="color:var(--success);">128</div><div class="sub">完成率 68.8%</div></div><div class="stat-item"><div class="label">本月机构录入</div><div class="value" style="color:var(--primary);">198</div><div class="sub">日均 7.6 单</div></div><div class="stat-item"><div class="label">本月机构流水</div><div class="value">¥52,600</div><div class="sub" style="color:var(--success);">较上月 ↑ 15%</div></div></div>':'<div class="stat-row"><div class="stat-item"><div class="label">今日订单总数</div><div class="value">45</div><div class="sub">当前正在执行中的订单</div></div><div class="stat-item"><div class="label">今日完成订单</div><div class="value" style="color:var(--success);">8</div><div class="sub">今日结束的订单</div></div><div class="stat-item"><div class="label">今日录入订单</div><div class="value" style="color:var(--primary);">12</div><div class="sub">今天新录入的订单</div></div><div class="stat-item"><div class="label">当前总订单</div><div class="value" style="color:var(--warning);">53</div><div class="sub">执行中 + 待指派</div></div></div><div class="stat-row"><div class="stat-item"><div class="label">本月累计订单</div><div class="value">486</div><div class="sub" style="color:var(--success);">较上月 ↑ 12%</div></div><div class="stat-item"><div class="label">本月累计完成</div><div class="value" style="color:var(--success);">328</div><div class="sub">完成率 67.5%</div></div><div class="stat-item"><div class="label">本月累计录入</div><div class="value" style="color:var(--primary);">512</div><div class="sub">日均 19.7 单</div></div><div class="stat-item"><div class="label">本月累计流水</div><div class="value">¥152,800</div><div class="sub" style="color:var(--success);">较上月 ↑ 22%</div></div></div>')+'<div class="ant-card"><div class="ant-card-head">📈 近7日经营趋势</div><div class="ant-card-body" style="overflow-x:auto;">'+svg+legend+'</div></div>'+reportH;
}

// ── 订单报表 ──
function rOrderReport(){var dailyRows=[{date:'05-26',cnt:28,amt:'¥8,920',done:8,doneAmt:'¥2,300'},{date:'05-25',cnt:20,amt:'¥5,800',done:6,doneAmt:'¥1,800'},{date:'05-24',cnt:26,amt:'¥8,500',done:10,doneAmt:'¥3,200'},{date:'05-23',cnt:22,amt:'¥6,900',done:8,doneAmt:'¥2,500'},{date:'05-22',cnt:24,amt:'¥7,800',done:9,doneAmt:'¥2,900'},{date:'05-21',cnt:18,amt:'¥5,100',done:5,doneAmt:'¥1,500'},{date:'05-20',cnt:21,amt:'¥6,200',done:7,doneAmt:'¥2,100'}];var rankRows=[{rank:1,booster:'王代练',done:12,amt:'¥4,800'},{rank:2,booster:'刘代练',done:10,amt:'¥3,900'},{rank:3,booster:'陈代练',done:8,amt:'¥3,200'},{rank:4,booster:'赵代练',done:7,amt:'¥2,800'},{rank:5,booster:'孙代练',done:5,amt:'¥1,900'}];var h='<div class="filter-bar"><input class="ant-input" style="width:200px;" placeholder="订单时间范围"><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">导出汇总</button><button class="ant-btn ant-btn-sm">导出按日明细</button></div><div class="ant-tabs"><div class="ant-tab'+(curSubTab==='按日统计'?' active':'')+'" onclick="curSubTab=\'按日统计\';renderContent()">按日统计</div><div class="ant-tab'+(curSubTab==='代练排行榜'?' active':'')+'" onclick="curSubTab=\'代练排行榜\';renderContent()">代练排行榜</div></div>';if(curSubTab==='按日统计'){h+='<div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>日期</th><th>订单数量</th><th>订单总金额</th><th>完成订单数</th><th>完成金额</th></tr></thead><tbody>';dailyRows.forEach(function(r){h+='<tr><td style="font-weight:500;">'+r.date+'</td><td>'+r.cnt+'</td><td>'+r.amt+'</td><td>'+r.done+'</td><td>'+r.doneAmt+'</td></tr>';});h+='</tbody></table></div></div></div>';}else{h+='<div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>排名</th><th>代练</th><th>完成订单数</th><th>完成金额</th></tr></thead><tbody>';rankRows.forEach(function(r){var medal=r.rank===1?'🥇':r.rank===2?'🥈':r.rank===3?'🥉':'';h+='<tr><td>'+medal+' '+r.rank+'</td><td style="font-weight:500;">'+r.booster+'</td><td>'+r.done+'</td><td>'+r.amt+'</td></tr>';});h+='</tbody></table></div></div></div>';}return h;}

// ── 机构结算驳回（全局） ──
function rejectGuildSettle(guild,amt){
  var body='<div class="ant-form-item"><div class="ant-form-label">机构名称</div><input class="ant-input" value="'+guild+'" readonly style="background:var(--bg);"></div>'+
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

// ── 机构结算 ──
function rGuildSettlement(){
  var rows=[
    {guild:'三角洲机构A组',admin:'张会长',tel:'138****1111',amt:'¥8,750.00',status:'待打款',st:'ant-tag-warning',method:'银行卡',settleInfo:'中国工商银行 6212****1234 张会长',channelFee:'¥87.50',monthlyTotal:'¥32,500.00',taxSupplement:'¥0.00',arrivalAmt:'¥8,662.50'},
    {guild:'三角洲机构B组',admin:'李会长',tel:'139****2222',amt:'¥4,760.00',status:'待打款',st:'ant-tag-warning',method:'支付宝',settleInfo:'支付宝 139****2222 李会长',channelFee:'¥47.60',monthlyTotal:'¥18,200.00',taxSupplement:'¥0.00',arrivalAmt:'¥4,712.40'},
    {guild:'三角洲机构C组',admin:'王会长',tel:'137****3333',amt:'¥2,730.00',status:'已打款',st:'ant-tag-success',method:'银行卡',settleInfo:'招商银行 6214****9012 王会长',channelFee:'¥27.30',monthlyTotal:'¥11,400.00',taxSupplement:'¥0.00',arrivalAmt:'¥2,702.70'},
    {guild:'三角洲机构A组',admin:'张会长',tel:'138****1111',amt:'¥12,500.00',status:'已打款',st:'ant-tag-success',method:'银行卡',settleInfo:'中国工商银行 6212****1234 张会长',channelFee:'¥125.00',monthlyTotal:'¥46,800.00',taxSupplement:'¥0.00',arrivalAmt:'¥12,375.00'},
    {guild:'三角洲机构B组',admin:'李会长',tel:'139****2222',amt:'¥8,200.00',status:'已打款',st:'ant-tag-success',method:'支付宝',settleInfo:'支付宝 139****2222 李会长',channelFee:'¥82.00',monthlyTotal:'¥28,500.00',taxSupplement:'¥0.00',arrivalAmt:'¥8,118.00'}
  ];
  var h='<div class="filter-bar"><select class="ant-input" style="width:110px;"><option>结算状态</option><option>待打款</option><option>已打款</option></select><select class="ant-input" style="width:110px;"><option>结算方式</option><option>银行卡</option><option>支付宝</option></select><input class="ant-input" style="width:140px;" placeholder="机构名称"><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">重置</button><button class="ant-btn ant-btn-sm" style="margin-left:8px;" onclick="exportGuildSettle()">导出 CSV</button></div>';
  h+='<div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th style="width:130px;">操作</th><th>机构名</th><th>管理员信息</th><th>结算状态</th><th>结算方式</th><th>结算信息</th><th>结算金额</th><th>通道费</th><th>当月累计结算</th><th>应补税费</th><th>到账金额</th></tr></thead><tbody>';
  rows.forEach(function(r){
    var action=r.status==='待打款'?'<div style="white-space:nowrap;"><button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'已打款 '+r.amt+' 至'+r.admin+'账户\')">确认打款</button> <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="rejectGuildSettle(\''+r.guild+'\',\''+r.amt+'\')">驳回</button></div>':'<span style="color:var(--text-secondary);">已打款</span>';
    h+='<tr><td>'+action+'</td><td style="font-weight:500;">'+r.guild+'</td><td>'+r.admin+'<br><span style="font-size:var(--font-size-sm);color:var(--text-secondary);">'+r.tel+'</span></td><td><span class="ant-tag '+r.st+'">'+r.status+'</span></td><td>'+r.method+'</td><td>'+r.settleInfo.replace(' ','<br><span style="font-size:var(--font-size-sm);color:var(--text-secondary);">')+'</span></td><td style="font-weight:600;">'+r.amt+'</td><td style="color:var(--text-secondary);">'+r.channelFee+'</td><td>'+r.monthlyTotal+'</td><td>'+r.taxSupplement+'</td><td style="color:var(--success);font-weight:600;">'+r.arrivalAmt+'</td></tr>';
  });
  h+='</tbody></table></div></div></div>';
  h+='<div class="ant-alert">💡 机构代练结算规则：平台 → 机构统一打款 → 机构线下分发给所属代练员。独立代练由平台直接结算。到账金额 = 结算金额 - 通道费 - 应补税费。</div>';
  return h;
}

function exportGuildSettle(){
  var rows=[],table=document.querySelector('#content-area .ant-table tbody');
  if(!table)return;
  table.querySelectorAll('tr').forEach(function(tr){var cells=[];tr.querySelectorAll('td').forEach(function(td){cells.push(td.textContent||'');});rows.push(cells);});
  var headers=['操作','机构名','管理员信息','结算状态','结算方式','结算信息','结算金额','通道费','当月累计结算','应补税费','到账金额'];
  exportCSV(headers,rows,'机构结算_'+new Date().toISOString().slice(0,10)+'.csv');
}
// ── 代练结算 ──
function rBoosterSettlement(){var rows=[{name:'王代练',pay:'¥500',entry:'¥400',settle:'¥280',order:'DD202605260009',status:'待结算',st:'ant-tag-warning',src:'内部录入',wait:'1天',tel:'138****1234'},{name:'刘代练',pay:'¥520',entry:'¥450',settle:'¥315',order:'DD202605250015',status:'待结算',st:'ant-tag-warning',src:'外部抢单',wait:'1天',tel:'139****5678'},{name:'陈代练',pay:'¥650',entry:'¥500',settle:'¥455',order:'DD202605250010',status:'待结算',st:'ant-tag-warning',src:'内部录入',wait:'2天',tel:'137****9012'},{name:'赵代练',pay:'¥800',entry:'¥650',settle:'¥560',order:'DD202605240020',status:'已结算',st:'ant-tag-success',src:'上家抢单',wait:'-',tel:'136****3456'},{name:'孙代练',pay:'¥120',entry:'¥100',settle:'¥84',order:'DD202605240015',status:'已结算',st:'ant-tag-success',src:'外部抢单',wait:'-',tel:'135****7890'}];var h='<div class="filter-bar"><select class="ant-input" style="width:110px;"><option>结算状态</option><option>待结算</option><option>已结算</option></select><input class="ant-input" style="width:140px;" placeholder="代练名称"><input class="ant-input" style="width:160px;" placeholder="订单号"><select class="ant-input" style="width:110px;"><option>订单来源</option><option>内部录入</option><option>上家抢单</option><option>外部抢单</option></select><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">重置</button><button class="ant-btn ant-btn-sm" style="margin-left:8px;" onclick="exportBoosterSettle()">导出 CSV</button></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>代练名称</th><th>用户支付金额</th><th>订单录入金额</th><th>应结算金额</th><th>订单号</th><th>结算状态</th><th>订单来源</th><th>等待结算时长</th><th>手机号</th><th>操作</th></tr></thead><tbody>';rows.forEach(function(r){h+='<tr class="clickable"><td>'+r.name+'</td><td>'+r.pay+'</td><td>'+r.entry+'</td><td style="font-weight:600;">'+r.settle+'</td><td class="link">'+r.order+'</td><td><span class="ant-tag '+r.st+'">'+r.status+'</span></td><td>'+r.src+'</td><td>'+r.wait+'</td><td>'+r.tel+'</td><td>'+(r.status==='待结算'?'<button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'✓ 已结算\')">结算</button>':'<span style="color:var(--text-secondary);">已结算</span>')+'</td></tr>';});h+='</tbody></table></div></div></div><div style="margin-top:12px;"><button class="ant-btn ant-btn-primary" onclick="toast(\'✓ 批量结算完成\')">批量结算（3笔）</button></div>';return h;}

function exportBoosterSettle(){
  var rows=[],table=document.querySelector('#content-area .ant-table tbody');
  if(!table)return;
  table.querySelectorAll('tr').forEach(function(tr){var cells=[];tr.querySelectorAll('td').forEach(function(td){cells.push(td.textContent||'');});rows.push(cells);});
  var headers=['代练名称','用户支付金额','订单录入金额','应结算金额','订单号','结算状态','订单来源','等待结算时长','手机号','操作'];
  exportCSV(headers,rows,'代练结算_'+new Date().toISOString().slice(0,10)+'.csv');
}
// ── 客服结算 ──
function rCSSettlement(){var rows=[{name:'小李',pay:'¥28,500',entry:'¥22,000',settle:'¥3,300',orders:'45单',status:'待结算',st:'ant-tag-warning'},{name:'小周',pay:'¥18,200',entry:'¥14,500',settle:'¥2,175',orders:'32单',status:'待结算',st:'ant-tag-warning'},{name:'客服A',pay:'¥12,800',entry:'¥10,000',settle:'¥1,500',orders:'20单',status:'已结算',st:'ant-tag-success'}];var h='<div class="filter-bar"><select class="ant-input" style="width:110px;"><option>结算状态</option><option>待结算</option><option>已结算</option></select><input class="ant-input" style="width:140px;" placeholder="客服名称"><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">重置</button><button class="ant-btn ant-btn-sm" style="margin-left:8px;" onclick="exportCSSettle()">导出 CSV</button></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>人员名称</th><th>用户支付金额</th><th>订单录入金额</th><th>应结算金额</th><th>订单数</th><th>结算状态</th><th>操作</th></tr></thead><tbody>';rows.forEach(function(r){h+='<tr class="clickable"><td>'+r.name+'</td><td>'+r.pay+'</td><td>'+r.entry+'</td><td style="font-weight:600;">'+r.settle+'</td><td>'+r.orders+'</td><td><span class="ant-tag '+r.st+'">'+r.status+'</span></td><td>'+(r.status==='待结算'?'<button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'✓ 已结算\')">结算</button>':'<span style="color:var(--text-secondary);">已结算</span>')+'</td></tr>';});h+='</tbody></table></div></div></div><div style="margin-top:12px;"><button class="ant-btn ant-btn-primary" onclick="toast(\'✓ 批量结算完成\')">批量结算（2笔）</button></div>';return h;}

function exportCSSettle(){
  var rows=[],table=document.querySelector('#content-area .ant-table tbody');
  if(!table)return;
  table.querySelectorAll('tr').forEach(function(tr){var cells=[];tr.querySelectorAll('td').forEach(function(td){cells.push(td.textContent||'');});rows.push(cells);});
  var headers=['人员名称','用户支付金额','订单录入金额','应结算金额','订单数','结算状态','操作'];
  exportCSV(headers,rows,'客服结算_'+new Date().toISOString().slice(0,10)+'.csv');
}
// ── 提现审核 ──
function rWithdrawAudit(){var rows=[{name:'王代练',type:'独立代练',guild:'-',amt:'¥2,500',method:'微信',acct:'wang***',time:'05-26 10:30'},{name:'刘代练',type:'独立代练',guild:'-',amt:'¥3,200',method:'支付宝',acct:'liu***',time:'05-25 16:00'},{name:'陈代练',type:'独立代练',guild:'-',amt:'¥2,800',method:'银行卡',acct:'6222****1234',time:'05-24 14:00'}];var h='<div class="ant-card"><div class="ant-card-head">待审核提现 <span style="font-size:var(--font-size);color:var(--danger);">（'+rows.length+'笔）</span></div><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>申请人</th><th>代练类型</th><th>所属机构</th><th>提现金额</th><th>收款方式</th><th>收款账号</th><th>申请时间</th><th>操作</th></tr></thead><tbody>';rows.forEach(function(r){h+='<tr class="clickable"><td>'+r.name+'</td><td>'+r.type+'</td><td>'+r.guild+'</td><td style="font-weight:600;">'+r.amt+'</td><td>'+r.method+'</td><td>'+r.acct+'</td><td>'+r.time+'</td><td><button class="ant-btn ant-btn-success ant-btn-sm" onclick="toast(\'✓ 已打款 '+r.amt+' 至 '+r.acct+'\')">通过</button> <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="toast(\'已驳回\')">驳回</button></td></tr>';});h+='</tbody></table></div></div></div><div class="ant-alert">仅审核独立代练提现申请。机构代练由机构线下结算分发，不经过此审核流程。</div>';return h;}

// ── 机构管理 ──
var orgList=[{name:'三角洲机构A组',admin:'张会长',desc:'三角洲游戏代练工作室，专注排位上分',status:1,createdAt:'2026-03-15',createdBy:'管理员',splitMode:'固定比例',splitVal:'70%'},{name:'三角洲机构B组',admin:'李会长',desc:'三角洲游戏代练工作室，综合代练服务',status:1,createdAt:'2026-04-01',createdBy:'管理员',splitMode:'固定金额',splitVal:'¥50/单'},{name:'三角洲机构C组',admin:'-',desc:'三角洲游戏代练工作室（筹备中）',status:0,createdAt:'2026-05-10',createdBy:'运营小周',splitMode:'保底+比例',splitVal:'¥30+15%'}];
function rOrgMgmt(){
  var h='<div style="display:flex;justify-content:space-between;margin-bottom:16px;"><button class="ant-btn ant-btn-primary" onclick="openOrgEdit(true)">+ 添加机构</button><input class="ant-input" style="width:200px;" placeholder="搜索机构名称..." id="orgFilterKw" oninput="renderContent()"></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th style="width:140px;">操作</th><th>机构名称</th><th>机构管理员</th><th>机构说明</th><th style="opacity:0.4;">分成模式 <span style="font-size:11px;">(二期)</span></th><th style="opacity:0.4;">分成数值 <span style="font-size:11px;">(二期)</span></th><th>状态</th><th>创建时间</th></tr></thead><tbody>';
  var kwEl=document.getElementById('orgFilterKw'); var kw=kwEl?kwEl.value.toLowerCase()||'':'';
  orgList.forEach(function(o){
    if(kw&&o.name.toLowerCase().indexOf(kw)===-1) return;
    var st=o.status?'<span class="ant-tag ant-tag-success">启用</span>':'<span class="ant-tag ant-tag-default">禁用</span>';
    h+='<tr><td style="white-space:nowrap;"><button class="ant-btn ant-btn-sm" onclick="openOrgEdit(false,\''+o.name+'\')">编辑</button> <button class="ant-btn ant-btn-sm '+(o.status?'ant-btn-danger':'ant-btn-success')+'" onclick="toggleOrgStatus(\''+o.name+'\')">'+(o.status?'禁用':'启用')+'</button></td><td style="font-weight:500;">'+o.name+'</td><td>'+o.admin+'</td><td style="color:var(--text-secondary);">'+o.desc+'</td><td style="opacity:0.4;">'+(o.splitMode==='-'?'-':'<span class="ant-tag ant-tag-primary">'+o.splitMode+'</span>')+'</td><td style="opacity:0.4;">'+o.splitVal+'</td><td>'+st+'</td><td>'+o.createdAt+'</td></tr>';
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
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>机构名称</div><input class="ant-input" id="oeName" value="'+name+'" placeholder="请输入机构名称"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>机构管理员</div><select class="ant-input" id="oeAdmin">'+adminOpt+'</select></div><div class="ant-form-item"><div class="ant-form-label">机构说明</div><textarea class="ant-input" id="oeDesc" placeholder="请简要描述该机构" rows="3">'+desc+'</textarea></div><div class="ant-row"><div class="ant-form-item"><div class="ant-form-label">机构资质</div><div class="upload-area" onclick="toast(\'已选择文件：营业执照.png\')">点击上传营业执照或相关资质</div></div><div class="ant-form-item"><div class="ant-form-label">合同文件</div><div class="upload-area" onclick="toast(\'已选择文件：代练合作协议.pdf\')">点击上传合作协议或合同文件</div></div></div><div class="ant-form-item"><div class="ant-form-label">状态</div><div class="radio-group"><label class="radio-item'+(status?' active':'')+'" onclick="this.parentNode.querySelectorAll(\'.radio-item\').forEach(function(el){el.classList.remove(\'active\')});this.classList.add(\'active\');document.getElementById(\'oeStatus\').value=\'1\'"><input type="radio" name="oeStatus" value="1"'+(status?' checked':'')+' style="display:none;">启用</label><label class="radio-item'+(!status?' active':'')+'" onclick="this.parentNode.querySelectorAll(\'.radio-item\').forEach(function(el){el.classList.remove(\'active\')});this.classList.add(\'active\');document.getElementById(\'oeStatus\').value=\'0\'"><input type="radio" name="oeStatus" value="0"'+(!status?' checked':'')+' style="display:none;">禁用</label></div><input type="hidden" id="oeStatus" value="'+(status?'1':'0')+'"></div><div class="ant-form-item" style="opacity:0.4;"><div class="ant-form-label">分成模式 <span style="font-size:11px;">(二期)</span></div>'+splitModeHTML(sm)+'</div><div class="ant-form-item" style="opacity:0.4;"><div class="ant-form-label">数值设定 <span style="font-size:11px;">(二期)</span></div>'+splitValHTML(sm,sv,sv2)+'</div>';
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
var posList=[{code:'booster',name:'代练',roles:'代练',desc:'游戏代练执行人员，接单执行交付',status:1,createdBy:'管理员',createdAt:'2026-05-19'},{code:'cs',name:'客服',roles:'平台客服',desc:'订单审核验收人员，处理客诉',status:1,createdBy:'管理员',createdAt:'2026-05-19'},{code:'operator',name:'运营',roles:'平台运营',desc:'平台运营管理人员，配置系统',status:1,createdBy:'管理员',createdAt:'2026-05-19'},{code:'guild_admin',name:'会长',roles:'机构管理员',desc:'机构管理员，管理本机构人员和订单',status:1,createdBy:'管理员',createdAt:'2026-05-20'},{code:'finance',name:'财务',roles:'平台财务',desc:'提现审核、机构/代练/客服结算',status:1,createdBy:'管理员',createdAt:'2026-05-20'},{code:'guild_operator',name:'机构运营',roles:'机构运营',desc:'订单录入，管理本机构人员和订单',status:1,createdBy:'管理员',createdAt:'2026-05-20'}];
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
  var name=p?p.name:'',code=p?p.code:'',desc=p?p.desc:'',roles=p?p.roles:'',pstatus=p?p.status:1;
  var allRoles=['平台管理员','平台运营','平台客服','平台财务','机构管理员','机构运营','代练'];
  var selRoles=roles?roles.split('、'):[];
  var rolesCheck='';
  allRoles.forEach(function(r){
    var checked=selRoles.indexOf(r)!==-1?' checked':'';
    rolesCheck+='<label style="display:inline-flex;align-items:center;gap:4px;margin-right:16px;margin-bottom:8px;cursor:pointer;"><input type="checkbox" value="'+r+'" class="peRole"'+checked+'> '+r+'</label>';
  });
  var body='<div class="ant-row"><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>岗位名称</div><input class="ant-input" id="peName" value="'+name+'" placeholder="请输入岗位名称"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>岗位代码</div><input class="ant-input" id="peCode" value="'+code+'" placeholder="请输入岗位代码"'+(isNew?'':' readonly style="background:#f5f5f5"')+'></div></div><div class="ant-form-item"><div class="ant-form-label">关联角色</div><div style="padding:8px 0;">'+rolesCheck+'</div></div><div class="ant-form-item"><div class="ant-form-label">描述</div><textarea class="ant-input" id="peDesc" placeholder="请简要描述该岗位的职责" rows="3">'+desc+'</textarea></div><div class="ant-form-item"><div class="ant-form-label">状态</div><div style="padding:8px 0;"><label style="display:inline-flex;align-items:center;gap:4px;margin-right:24px;cursor:pointer;"><input type="radio" name="peStatus" value="1"'+(pstatus===1?' checked':'')+'> 启用</label><label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;"><input type="radio" name="peStatus" value="0"'+(pstatus===0?' checked':'')+'> 禁用</label></div></div>';
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
  var statusEl=document.querySelector('input[name="peStatus"]:checked');
  var pstatus=statusEl?parseInt(statusEl.value):1;
  posList.push({code:code,name:name,roles:roles.join('、')||'-',desc:desc||'-',status:pstatus,createdBy:'当前用户',createdAt:new Date().toISOString().slice(0,10)});
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
  var statusEl=document.querySelector('input[name="peStatus"]:checked');
  p.name=name;p.desc=desc||'-';p.roles=roles.join('、')||'-';p.status=statusEl?parseInt(statusEl.value):1;
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
var userList=[{uid:'U20260527001',name:'王代练',tel:'138xxxx1234',guild:'三角洲机构A组',pos:'代练',acct:'wang_dl',password:'123456'},{uid:'U20260527002',name:'刘代练',tel:'139xxxx5678',guild:'三角洲机构A组',pos:'代练',acct:'liu_dl',password:'123456'},{uid:'U20260527003',name:'陈代练',tel:'137xxxx9012',guild:'-',pos:'代练',acct:'chen_dl',password:'123456'},{uid:'U20260527004',name:'赵代练',tel:'136xxxx3456',guild:'三角洲机构A组',pos:'代练',acct:'zhao_dl',password:'123456'},{uid:'U20260527005',name:'孙代练',tel:'135xxxx7890',guild:'三角洲机构B组',pos:'代练',acct:'sun_dl',password:'123456'},{uid:'U20260527006',name:'张会长',tel:'138xxxx1111',guild:'三角洲机构A组',pos:'会长',acct:'zhang_hz',password:'123456'},{uid:'U20260527007',name:'小李',tel:'139xxxx0001',guild:'-',pos:'客服',acct:'li_xiaomei',password:'123456'},{uid:'U20260527008',name:'小周',tel:'139xxxx0002',guild:'-',pos:'运营',acct:'zhou_xiao',password:'123456'}];
var userNextId=9;
function rUserMgmt(){
  var h='<div style="display:flex;justify-content:space-between;margin-bottom:16px;"><div style="display:flex;gap:8px;"><button class="ant-btn ant-btn-primary" onclick="openUserEdit(true)">+ 添加用户</button></div><div style="display:flex;gap:8px;"><select class="ant-input" style="width:150px;" id="uFilterOrg"><option value="">全部组织</option><option value="平台">平台</option><option value="三角洲机构A组">三角洲机构A组</option><option value="三角洲机构B组">三角洲机构B组</option></select><input class="ant-input" style="width:180px;" placeholder="搜索姓名/手机号/编号..." id="uFilterKw" oninput="renderContent()"></div></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th style="width:140px;">操作</th><th>用户编号</th><th>用户姓名</th><th>手机号</th><th>机构</th><th>岗位</th></tr></thead><tbody>';
  var orgEl=document.getElementById('uFilterOrg'); var orgVal=orgEl?orgEl.value:'';
  var kwEl=document.getElementById('uFilterKw'); var kwVal=kwEl?kwEl.value.toLowerCase()||'':'';
  userList.forEach(function(u){
    if(orgVal&&u.guild!==orgVal) return;
    if(kwVal&&u.uid.toLowerCase().indexOf(kwVal)===-1&&u.name.toLowerCase().indexOf(kwVal)===-1&&u.tel.indexOf(kwVal)===-1) return;
    var gd=u.guild==='-'?'-':'<span class="ant-tag ant-tag-purple">'+u.guild+'</span>';
    h+='<tr><td style="white-space:nowrap;"><button class="ant-btn ant-btn-sm" onclick="openUserEdit(false,\''+u.uid+'\')">编辑</button> <button class="ant-btn ant-btn-sm" style="background:var(--warning);color:#fff;border-color:var(--warning);" onclick="openResetPassword(\''+u.uid+'\')">重置密码</button> <button class="ant-btn ant-btn-sm ant-btn-danger" onclick="deleteUser(\''+u.uid+'\')">删除</button></td><td style="font-weight:500;">'+u.uid+'</td><td>'+u.name+'</td><td>'+u.tel+'</td><td>'+gd+'</td><td>'+u.pos+'</td></tr>';
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
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>用户账号</div><input class="ant-input" id="ueAcct" value="'+(isNew?'':acct)+'" placeholder="请输入用户账号"></div><div class="ant-row"><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>用户姓名</div><input class="ant-input" id="ueName" value="'+name+'" placeholder="请输入用户姓名"></div><div class="ant-form-item"><div class="ant-form-label">手机号</div><input class="ant-input" id="ueTel" value="'+tel+'" placeholder="请输入手机号（选填）"></div></div><div class="ant-row"><div class="ant-form-item"><div class="ant-form-label">所属组织</div><select class="ant-input" id="ueGuild"><option value="">请选择组织</option><option value="平台"'+(guild==='平台'?' selected':'')+'>平台</option><option value="三角洲机构A组"'+(guild==='三角洲机构A组'?' selected':'')+'>三角洲机构A组</option><option value="三角洲机构B组"'+(guild==='三角洲机构B组'?' selected':'')+'>三角洲机构B组</option></select></div><div class="ant-form-item"><div class="ant-form-label">岗位</div><select class="ant-input" id="uePos"><option value="">请选择岗位</option><option value="会长"'+('会长'===pos?' selected':'')+'>会长</option><option value="运营"'+('运营'===pos?' selected':'')+'>运营</option><option value="客服"'+('客服'===pos?' selected':'')+'>客服</option><option value="代练"'+('代练'===pos?' selected':'')+'>代练</option></select></div></div>';
  var footer='<button class="ant-btn" onclick="closeModal()">取消</button>'+(isNew?'<button class="ant-btn ant-btn-primary" onclick="saveNewUser()">保存</button>':'<button class="ant-btn ant-btn-primary" onclick="saveEditUser(\''+uid+'\')">保存</button>');
  openModal(title,body,footer);
}
function saveNewUser(){
  var acct=document.getElementById('ueAcct').value.trim();
  var name=document.getElementById('ueName').value.trim();
  var tel=document.getElementById('ueTel').value.trim();
  var guild=document.getElementById('ueGuild').value;
  var pos=document.getElementById('uePos').value;
  if(!acct) return toast('请输入<span style="color:var(--danger);">用户账号</span>');
  if(!name) return toast('请输入<span style="color:var(--danger);">用户姓名</span>');
  var uid='U'+new Date().toISOString().slice(0,10).replace(/-/g,'')+String(userNextId).padStart(3,'0');
  userNextId++;
  userList.push({uid:uid,name:name,tel:tel||'-',guild:guild||'-',pos:pos||'-',acct:acct,password:'123456'});
  closeModal();
  toast('用户 <span style="color:var(--danger);">'+name+'</span> 添加成功，编号 '+uid+'，默认密码 123456');
  renderContent();
}
function saveEditUser(uid){
  var name=document.getElementById('ueName').value.trim();
  var tel=document.getElementById('ueTel').value.trim();
  var guild=document.getElementById('ueGuild').value;
  var pos=document.getElementById('uePos').value;
  if(!name) return toast('请输入<span style="color:var(--danger);">用户姓名</span>');
  var u=userList.find(function(x){return x.uid===uid;});
  if(!u) return;
  u.name=name;u.tel=tel||'-';u.guild=guild||'-';u.pos=pos||'-';
  closeModal();
  toast('用户 <span style="color:var(--danger);">'+name+'</span> 信息已更新');
  renderContent();
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
function openResetPassword(uid){
  var u=userList.find(function(x){return x.uid===uid;});
  if(!u) return;
  var body='<p>确认重置用户 <strong>'+u.name+'</strong>（'+uid+'）的密码吗？</p><p style="color:var(--text-tertiary);">重置后将生成新的随机密码。</p>';
  openModal('重置密码',body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-danger" onclick="confirmResetPassword(\''+uid+'\')">确认重置</button>');
}
function confirmResetPassword(uid){
  var u=userList.find(function(x){return x.uid===uid;});
  if(!u) return;
  var np='QZ'+Math.random().toString(36).slice(-6).toUpperCase();
  u.password=np;
  closeModal();
  openModal('重置密码','<p>用户 <strong>'+u.name+'</strong>（'+uid+'）的密码已重置：</p><div style="background:var(--bg);padding:12px;border-radius:var(--radius-sm);text-align:center;font-size:20px;font-weight:700;letter-spacing:2px;margin:8px 0;">'+np+'</div><p style="color:var(--text-tertiary);">请妥善保管新密码，切勿泄露。</p>','<button class="ant-btn ant-btn-primary" onclick="closeModal()">我知道了</button>');
}

// ── 代练审核 ──
function rBoosterReview(){return'<div style="position:relative;"><div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,.6);z-index:10;border-radius:var(--radius-lg);cursor:not-allowed;"></div><div class="ant-card"><div class="ant-card-head">待审核代练身份 <span style="font-size:var(--font-size);color:var(--danger);">（2人）</span></div><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>账号</th><th>昵称</th><th>手机号</th><th>申请机构</th><th>添加人</th><th>游戏特长</th><th>申请时间</th><th>操作</th></tr></thead><tbody><tr><td>new_dl_a</td><td>新代练A</td><td>136****0001</td><td><span class="ant-tag ant-tag-purple">三角洲机构A组</span></td><td>张会长</td><td>三角洲·排位上分·装备刷取</td><td>05-26 09:00</td><td><button class="ant-btn ant-btn-success ant-btn-sm">通过</button> <button class="ant-btn ant-btn-danger ant-btn-sm">驳回</button></td></tr><tr><td>new_dl_b</td><td>新代练B</td><td>137****0002</td><td>-（独立代练）</td><td>运营小周</td><td>三角洲·综合代练</td><td>05-26 10:30</td><td><button class="ant-btn ant-btn-success ant-btn-sm">通过</button> <button class="ant-btn ant-btn-danger ant-btn-sm">驳回</button></td></tr></tbody></table></div></div></div><div class="ant-alert">代练身份审核流程：机构管理员/运营添加代练 → 平台运营审核身份 → 通过后代练员可登录系统接单</div></div>';}

// ── 下家绑定 ──
function rBindSet(){return'<div style="position:relative;"><div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,.6);z-index:10;border-radius:var(--radius-lg);cursor:not-allowed;"></div><div class="filter-bar"><input class="ant-input" style="width:160px;" placeholder="下家SaaS编号"><input class="ant-input" style="width:160px;" placeholder="下家SaaS账号"><input class="ant-input" style="width:180px;" placeholder="下家系统名称"><button class="ant-btn ant-btn-primary ant-btn-sm">查询</button><button class="ant-btn ant-btn-sm">重置</button><button class="ant-btn ant-btn-primary ant-btn-sm" style="margin-left:auto;">+ 绑定下家</button></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>下家SaaS编号</th><th>下家SaaS账号</th><th>下家系统名称</th><th>添加操作人</th><th>添加时间</th><th>操作</th></tr></thead><tbody><tr><td>DS-2026001</td><td>guild_a_partner</td><td>三角洲机构A组·下游</td><td>管理员</td><td>2026-03-15 09:30</td><td><button class="ant-btn ant-btn-sm">编辑</button> <button class="ant-btn ant-btn-danger ant-btn-sm">解绑</button></td></tr><tr><td>DS-2026002</td><td>guild_b_partner</td><td>三角洲机构B组·下游</td><td>管理员</td><td>2026-04-01 14:00</td><td><button class="ant-btn ant-btn-sm">编辑</button> <button class="ant-btn ant-btn-danger ant-btn-sm">解绑</button></td></tr><tr><td>DS-2026003</td><td>studio_x_partner</td><td>X电竞工作室</td><td>运营小周</td><td>2026-05-10 16:20</td><td><button class="ant-btn ant-btn-sm">编辑</button> <button class="ant-btn ant-btn-danger ant-btn-sm">解绑</button></td></tr></tbody></table></div></div></div></div>';}

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
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>服务名称</div><input class="ant-input" value="'+n+'" placeholder="如：排位上分"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>服务代码</div><select class="ant-input"><option '+(c?'':'selected')+'>请选择关联代码</option><option '+(c==='knife_run'?'selected':'')+'>knife_run</option><option '+(c==='rank_push'?'selected':'')+'>rank_push</option><option '+(c==='task_farm'?'selected':'')+'>task_farm</option><option '+(c==='level_up'?'selected':'')+'>level_up</option><option '+(c==='gear_farm'?'selected':'')+'>gear_farm</option></select></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>规格类型</div><select class="ant-input"><option '+(st==='哈夫币数量'?'selected':'')+'>哈夫币数量</option><option '+(st==='段位范围'?'selected':'')+'>段位范围</option><option '+(st==='任务类型'?'selected':'')+'>任务类型</option><option '+(st==='等级范围'?'selected':'')+'>等级范围</option><option '+(st==='刷取次数'?'selected':'')+'>刷取次数</option></select></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>规格数值</div><div id="sv-list">'+valsHTML+'</div><button class="ant-btn ant-btn-sm" onclick="var el=document.getElementById(\'sv-list\');var i=el.children.length;var d=document.createElement(\'div\');d.id=\'sv-row-\'+i;d.style.cssText=\'display:flex;gap:8px;margin-bottom:8px;\';d.innerHTML=\'<input class=ant-input placeholder=如：青铜→钻石 style=flex:1><button class=ant-btn ant-btn-sm onclick=this.parentNode.parentNode.removeChild(this.parentNode) style=flex-shrink:0>✕</button>\';el.appendChild(d);">+ 添加数值</button></div><div class="ant-form-item"><div class="ant-form-label">状态</div><div style="display:flex;gap:16px;"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;"><input type="radio" name="svcStatus" '+(chk?'checked':'')+'> 启用</label><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;"><input type="radio" name="svcStatus" '+(!chk?'checked':'')+'> 禁用</label></div></div>';
  openModal(title,body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="toast(\'✓ '+(isNew?'添加成功':'保存成功')+'\');closeModal();openServiceConfig()">'+(isNew?'确认添加':'保存')+'</button>');
}
function openServiceConfig(){
  var toggleBtn=function(on){return on?'<span style="display:inline-block;width:40px;height:22px;background:var(--primary);border-radius:11px;position:relative;cursor:pointer;" onclick="toast(\'状态已切换\')"><span style="position:absolute;right:2px;top:2px;width:18px;height:18px;background:#fff;border-radius:50%;"></span></span>':'<span style="display:inline-block;width:40px;height:22px;background:#ccc;border-radius:11px;position:relative;cursor:pointer;" onclick="toast(\'状态已切换\')"><span style="position:absolute;left:2px;top:2px;width:18px;height:18px;background:#fff;border-radius:50%;"></span></span>';};
  var rows=[
    {name:'跑刀',code:'knife_run',specType:'哈夫币数量',specVals:'300万,500万,800万,1000万',on:true}
  ];
  var body='<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><div style="font-weight:600;">三角洲行动 — 服务类型配置</div><button class="ant-btn ant-btn-primary ant-btn-sm" disabled style="opacity:0.4;cursor:not-allowed;">+ 添加服务（二期）</button></div><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>服务名称</th><th>服务代码</th><th>规格类型</th><th>状态</th><th>操作</th></tr></thead><tbody>';
  rows.forEach(function(r){
    body+='<tr><td style="font-weight:500;">'+r.name+'</td><td>'+r.code+'</td><td><span class="ant-tag ant-tag-primary">'+r.specType+'</span></td><td>'+toggleBtn(r.on)+'</td><td><button class="ant-btn ant-btn-sm" onclick="openServiceEdit(false,\''+r.name+'\',\''+r.code+'\',\''+r.specType+'\',\''+r.specVals.replace(/'/g,"\\'")+'\','+r.on+')">编辑</button> <button class="ant-btn ant-btn-sm" onclick="toast(\''+(r.on?'已禁用':'已启用')+' '+r.name+'\')">'+(r.on?'禁用':'启用')+'</button></td></tr>';
  });
  body+='</tbody></table></div>';
  openModal('🛠 服务类型配置',body,'<button class="ant-btn" onclick="closeModal()">关闭</button>');
}
// ── 游戏属性配置 ──
var gameAttrList=[{id:1,name:'游戏账号',inputType:'输入框',children:[]},{id:2,name:'当前段位',inputType:'下拉选择',children:['青铜','黄金','铂金','钻石','黑鹰','统帅']},{id:3,name:'目标段位',inputType:'下拉选择',children:['黄金','铂金','钻石','黑鹰','统帅']},{id:4,name:'需要陪玩',inputType:'勾选',children:[]},{id:5,name:'是否加急',inputType:'勾选',children:[]}];
var gameAttrNextId=6;
function openAttrConfig(){
  var body='<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><div style="font-weight:600;">三角洲行动 — 属性配置</div><button class="ant-btn ant-btn-primary ant-btn-sm" onclick="openAttrEdit(true)">+ 添加属性</button></div>';
  if(gameAttrList.length===0){body+='<div style="text-align:center;padding:40px;color:var(--text-secondary);">暂无属性配置，点击上方按钮添加</div>';}
  else {
    body+='<div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>属性名称</th><th>输入方式</th><th>下级属性</th><th>操作</th></tr></thead><tbody>';
    gameAttrList.forEach(function(a){
      var childrenStr=a.children.length?a.children.join('、'):'-';
      var typeTag=a.inputType==='输入框'?'<span class="ant-tag ant-tag-primary">输入框</span>':a.inputType==='勾选'?'<span class="ant-tag ant-tag-success">勾选</span>':'<span class="ant-tag ant-tag-warning">下拉选择</span>';
      body+='<tr><td style="font-weight:500;">'+a.name+'</td><td>'+typeTag+'</td><td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+(a.children.join(',')||'')+'">'+childrenStr+'</td><td><button class="ant-btn ant-btn-sm" onclick="openAttrEdit(false,'+a.id+')">编辑</button> <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="deleteAttr('+a.id+')">删除</button></td></tr>';
    });
    body+='</tbody></table></div>';
  }
  openModal('🔧 属性配置',body,'<button class="ant-btn" onclick="closeModal()">关闭</button>');
}
function addAttrChild(){
  var el=document.getElementById('ach-list');
  var i=el.children.length;
  var d=document.createElement('div');
  d.style.cssText='display:flex;gap:8px;margin-bottom:8px;';
  d.innerHTML='<input class="ant-input" placeholder="如：青铜" style="flex:1;"><button class="ant-btn ant-btn-sm" onclick="this.parentNode.parentNode.removeChild(this.parentNode)" style="flex-shrink:0;">✕</button>';
  el.appendChild(d);
}
function buildAttrChildrenHTML(children){
  var h='';
  children.forEach(function(c,i){
    h+='<div style="display:flex;gap:8px;margin-bottom:8px;"><input class="ant-input" value="'+c+'" placeholder="如：青铜" style="flex:1;"><button class="ant-btn ant-btn-sm" onclick="this.parentNode.parentNode.removeChild(this.parentNode)" style="flex-shrink:0;">✕</button></div>';
  });
  return h;
}
function openAttrEdit(isNew,id){
  var a=null;
  if(!isNew){a=gameAttrList.find(function(x){return x.id===id;});if(!a)return;}
  var title=isNew?'添加属性':'编辑属性 - '+(a?a.name:'');
  var name=a?a.name:'',inputType=a?a.inputType:'输入框',children=a?a.children:[];
  var selInput='<option value="输入框"'+(inputType==='输入框'?' selected':'')+'>输入框</option><option value="勾选"'+(inputType==='勾选'?' selected':'')+'>勾选</option><option value="下拉选择"'+(inputType==='下拉选择'?' selected':'')+'>下拉选择</option>';
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>属性名称</div><input class="ant-input" id="aeName" value="'+name+'" placeholder="如：当前段位"></div>'+
    '<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>输入方式</div><select class="ant-input" id="aeInputType" onchange="document.getElementById(\'children-area\').style.display=this.value===\'下拉选择\'?\'\':\'none\'">'+selInput+'</select></div>'+
    '<div class="ant-form-item" id="children-area" style="display:'+(inputType==='下拉选择'?'':'none')+';"><div class="ant-form-label">下级属性</div><div id="ach-list">'+buildAttrChildrenHTML(children)+'</div><button class="ant-btn ant-btn-sm" onclick="addAttrChild()">+ 添加选项</button></div>';
  var footer='<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="'+(isNew?'saveNewAttr()':'saveEditAttr('+id+')')+'">保存</button>';
  openModal(title,body,footer);
}
function saveNewAttr(){
  var name=document.getElementById('aeName').value.trim();
  var inputType=document.getElementById('aeInputType').value;
  if(!name) return toast('请输入<span style="color:var(--danger);">属性名称</span>');
  var children=[];
  if(inputType==='下拉选择'){
    var inputs=document.querySelectorAll('#ach-list input');
    inputs.forEach(function(inp){var v=inp.value.trim();if(v) children.push(v);});
  }
  gameAttrList.push({id:gameAttrNextId++,name:name,inputType:inputType,children:children});
  closeModal();toast('属性 <span style="color:var(--danger);">'+name+'</span> 添加成功');openAttrConfig();
}
function saveEditAttr(id){
  var name=document.getElementById('aeName').value.trim();
  var inputType=document.getElementById('aeInputType').value;
  if(!name) return toast('请输入<span style="color:var(--danger);">属性名称</span>');
  var a=gameAttrList.find(function(x){return x.id===id;});if(!a)return;
  a.name=name;a.inputType=inputType;a.children=[];
  if(inputType==='下拉选择'){
    var inputs=document.querySelectorAll('#ach-list input');
    inputs.forEach(function(inp){var v=inp.value.trim();if(v) a.children.push(v);});
  }
  closeModal();toast('属性 <span style="color:var(--danger);">'+name+'</span> 已更新');openAttrConfig();
}
function deleteAttr(id){
  var a=gameAttrList.find(function(x){return x.id===id;});if(!a)return;
  gameAttrList=gameAttrList.filter(function(x){return x.id!==id;});
  toast('属性 <span style="color:var(--danger);">'+a.name+'</span> 已删除');openAttrConfig();
}
function rGameConfig(){
  var h='<div style="display:flex;justify-content:space-between;margin-bottom:16px;"><div style="font-size:var(--font-size-lg);font-weight:600;">游戏配置</div><button class="ant-btn ant-btn-primary" onclick="openGameEdit(true)">+ 添加游戏</button></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th class="sticky-col">操作</th><th>游戏ID</th><th>游戏名称</th><th>游戏图标</th><th>服务类型</th><th>订单类型</th><th>创建时间</th><th>创建人</th><th>状态</th></tr></thead><tbody><tr><td class="sticky-col" style="white-space:nowrap;"><button class="ant-btn ant-btn-sm" onclick="openGameEdit(false)">编辑</button> <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="toast(\'已删除\')">删除</button> <button class="ant-btn ant-btn-sm" onclick="openServiceConfig()">服务配置</button> <button class="ant-btn ant-btn-sm" onclick="openAttrConfig()">属性配置</button></td><td>1002</td><td style="font-weight:500;">三角洲行动</td><td><span style="font-size:24px;">🎯</span></td><td><span class="ant-tag ant-tag-primary">跑刀</span></td><td><span class="ant-tag ant-tag-primary">代练</span> <span class="ant-tag ant-tag-success">陪玩</span></td><td>2026-05-19 10:30</td><td>管理员</td><td><span style="display:inline-block;width:40px;height:22px;background:var(--primary);border-radius:11px;position:relative;cursor:pointer;" onclick="toast(\'状态已切换\')"><span style="position:absolute;right:2px;top:2px;width:18px;height:18px;background:#fff;border-radius:50%;"></span></span></td></tr></tbody></table></div></div></div>';
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
    {name:'跑刀',code:'knife_run',settleType:'按比例分成',splitVal:'70',time:'2026-05-19 10:30',creator:'管理员'}
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
// ── 权限管理 ──
var roleList=[{code:'root',name:'平台管理员',builtin:true,status:1,desc:'系统最高权限，处理特殊事件',time:'2026-05-19',perms:{'home':1,'platform-assets':1,'my-assets':1,'my-assets-guild-settle':1,'order-entry':1,'order-entry-op':1,'order-mgmt':1,'order-pool':1,'guild-settlement':1,'guild-settlement-audit':1,'org-mgmt':1,'position-mgmt':1,'user-mgmt':1,'game-config':1,'game-config-attr':1,'service-type-mgmt':1,'service-type-config':1,'permission-mgmt':1,'permission-matrix':1}},{code:'operator',name:'平台运营',builtin:true,status:1,desc:'订单录入、代练管理、机构管理、系统配置',time:'2026-05-19',perms:{'home':1,'order-entry':1,'order-entry-op':1,'order-mgmt':1,'order-pool':1,'position-mgmt':1,'user-mgmt':1,'game-config':1,'game-config-attr':1,'service-type-mgmt':1,'service-type-config':1}},{code:'cs',name:'平台客服',builtin:true,status:1,desc:'订单审核、验收、结算',time:'2026-05-19',perms:{'home':1,'order-mgmt':1}},{code:'finance',name:'平台财务',builtin:true,status:1,desc:'提现审核、机构/代练/客服结算',time:'2026-05-20',perms:{'home':1,'order-mgmt':1,'guild-settlement':1,'guild-settlement-audit':1}},{code:'guild_admin',name:'机构管理员',builtin:true,status:1,desc:'机构最高权限，管理本机构代练',time:'2026-05-20',perms:{'home':1,'my-assets':1,'my-assets-guild-settle':1,'order-entry':1,'order-entry-op':1,'order-mgmt':1,'order-pool':1}},{code:'guild_operator',name:'机构运营',builtin:true,status:1,desc:'订单录入，管理本机构人员和订单',time:'2026-05-20',perms:{'home':1,'my-assets':1,'order-entry':1,'order-entry-op':1,'order-mgmt':1,'order-pool':1}},{code:'booster',name:'代练',builtin:true,status:1,desc:'接单、执行、交付、提现',time:'2026-05-19',perms:{'home':1,'my-assets':1,'order-mgmt':1,'order-pool':1}}];
var permTreeData=[{id:'workspace',label:'工作台',children:[{id:'home',label:'首页',children:[]},{id:'platform-assets',label:'平台资产',children:[]},{id:'my-assets',label:'我的资产',children:[{id:'my-assets-guild-settle',label:'机构结算',children:[]}]}]},{id:'order',label:'订单管理',children:[{id:'order-entry',label:'订单录入',children:[{id:'order-entry-op',label:'操作',children:[]}]},{id:'order-mgmt',label:'订单管理',children:[]},{id:'order-pool',label:'订单池',children:[]}]},{id:'finance',label:'财务管理',children:[{id:'guild-settlement',label:'机构结算',children:[{id:'guild-settlement-audit',label:'机构结算审核',children:[]}]}]},{id:'personnel',label:'人员管理',children:[{id:'org-mgmt',label:'机构管理',children:[]},{id:'position-mgmt',label:'岗位管理',children:[]},{id:'user-mgmt',label:'用户管理',children:[]}]},{id:'system',label:'系统管理',children:[{id:'game-config',label:'游戏设置',children:[{id:'game-config-attr',label:'游戏配置',children:[]}]},{id:'service-type-mgmt',label:'服务类型',children:[{id:'service-type-config',label:'服务类型配置',children:[]}]},{id:'permission-mgmt',label:'权限管理',children:[{id:'permission-matrix',label:'权限矩阵配置',children:[]}]}]}];
var tempPerms={};
function rPermissionMgmt(){
  var h='<div style="margin-bottom:16px;"><button class="ant-btn ant-btn-primary" onclick="openRoleEdit(true)">+ 添加角色</button></div><div class="ant-card"><div class="ant-card-body np"><div class="ant-table-wrap"><table class="ant-table"><thead><tr><th>编码</th><th>名称</th><th>内置角色</th><th>状态</th><th>描述</th><th>创建时间</th><th>操作</th></tr></thead><tbody>';
  roleList.forEach(function(r){
    var st=r.status?'<span class="ant-tag ant-tag-success">启用</span>':'<span class="ant-tag ant-tag-default">禁用</span>';
    h+='<tr><td>'+r.code+'</td><td style="font-weight:500;">'+r.name+'</td><td><span class="ant-tag ant-tag-'+(r.builtin?'success':'default')+'">'+(r.builtin?'是':'否')+'</span></td><td>'+st+'</td><td>'+r.desc+'</td><td>'+r.time+'</td><td style="white-space:nowrap;"><button class="ant-btn ant-btn-sm" onclick="openRoleEdit(false,\''+r.code+'\')">编辑</button>'+(!r.builtin?' <button class="ant-btn ant-btn-sm '+(r.status?'ant-btn-danger':'ant-btn-success')+'" onclick="toggleRoleStatus(\''+r.code+'\')">'+(r.status?'禁用':'启用')+'</button> <button class="ant-btn ant-btn-danger ant-btn-sm" onclick="deleteRole(\''+r.code+'\')">删除</button>':'')+'</td></tr>';
  });
  h+='</tbody></table></div></div></div>';
  return h;
}
function renderPermTreeHTML(node,depth){
  var hasChildren=node.children&&node.children.length>0;
  var allChecked=true,someChecked=false;
  if(hasChildren){
    node.children.forEach(function(c){
      var cv=permNodeChecked(c);
      if(cv) someChecked=true;
      if(cv!==2) allChecked=false;
    });
  }
  var selfChecked=permNodeChecked(node);
  var checked=selfChecked===2?' checked':'';
  var indeterminate=(!allChecked&&someChecked)?' indeterminate':'';
  var h='';
  if(depth===1){
    h+='<div class="perm-group" style="margin-bottom:4px;">';
    h+='<div class="perm-group-hd" onclick="var p=this.parentNode;var b=p.querySelector(\'.perm-group-bd\');var arr=p.querySelector(\'.perm-arr\');if(b.style.display===\'none\'){b.style.display=\'\';arr.textContent=\'\u25bc\'}else{b.style.display=\'none\';arr.textContent=\'\u25b6\'}" style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:var(--bg);border-radius:4px;cursor:pointer;user-select:none;font-weight:500;"><span class="perm-arr" style="font-size:10px;width:14px;">▼</span><label style="cursor:pointer;display:flex;align-items:center;gap:4px;" onclick="event.stopPropagation();"><input type="checkbox" class="perm-cb perm-parent" data-id="'+node.id+'" onchange="onPermParentChange(this)"'+checked+indeterminate+'> '+node.label+'</label></div>';
    h+='<div class="perm-group-bd" style="padding-left:24px;">';
  }else if(depth===2){
    if(hasChildren){
      h+='<div class="perm-subgroup" style="margin-bottom:2px;">';
      h+='<div class="perm-subgroup-hd" onclick="var p=this.parentNode;var b=p.querySelector(\'.perm-subgroup-bd\');var arr=p.querySelector(\'.perm-arr\');if(b.style.display===\'none\'){b.style.display=\'\';arr.textContent=\'\u25bc\'}else{b.style.display=\'none\';arr.textContent=\'\u25b6\'}" style="display:flex;align-items:center;gap:6px;padding:4px 6px;cursor:pointer;user-select:none;border-radius:2px;"><span class="perm-arr" style="font-size:10px;width:14px;">▼</span><label style="cursor:pointer;display:flex;align-items:center;gap:4px;" onclick="event.stopPropagation();"><input type="checkbox" class="perm-cb perm-parent" data-id="'+node.id+'" onchange="onPermParentChange(this)"'+checked+indeterminate+'> '+node.label+'</label></div>';
      h+='<div class="perm-subgroup-bd" style="padding-left:24px;">';
    }else{
      h+='<div style="padding:4px 6px 4px 26px;display:flex;align-items:center;gap:4px;"><label style="cursor:pointer;"><input type="checkbox" class="perm-cb perm-leaf" data-id="'+node.id+'" onchange="onPermLeafChange(this)"'+checked+'> '+node.label+'</label></div>';
    }
  }else{
    h+='<div style="padding:3px 6px 3px 24px;display:flex;align-items:center;gap:4px;"><label style="cursor:pointer;font-size:13px;"><input type="checkbox" class="perm-cb perm-leaf" data-id="'+node.id+'" onchange="onPermLeafChange(this)"'+checked+'> '+node.label+'</label></div>';
  }
  if(hasChildren){
    node.children.forEach(function(c){h+=renderPermTreeHTML(c,depth+1);});
  }
  if(depth===1){h+='</div></div>';}
  else if(depth===2&&hasChildren){h+='</div></div>';}
  return h;
}
function buildPermTreeHTML(){
  var h='<div style="max-height:360px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);padding:8px;">';
  permTreeData.forEach(function(node){h+=renderPermTreeHTML(node,1);});
  h+='</div>';
  return h;
}
function permNodeChecked(node){
  if(node.children&&node.children.length){
    var all=true,some=false;
    node.children.forEach(function(c){
      var cv=permNodeChecked(c);
      if(cv) some=true;
      if(cv!==2) all=false;
    });
    return all?2:(some?1:0);
  }
  return tempPerms[node.id]?2:0;
}
function onPermParentChange(cb){
  var id=cb.dataset.id;
  var val=cb.checked;
  setDescendants(permTreeData,id,val);
  refreshPermTree();
  function setDescendants(nodes,targetId,val){
    nodes.forEach(function(n){
      if(n.id===targetId){setAll(n,val);return;}
      if(n.children) setDescendants(n.children,targetId,val);
    });
  }
  function setAll(node,val){
    if(!node.children||!node.children.length){tempPerms[node.id]=val?1:0;return;}
    node.children.forEach(function(c){setAll(c,val);});
  }
}
function onPermLeafChange(cb){
  tempPerms[cb.dataset.id]=cb.checked?1:0;
  refreshPermTree();
}
function refreshPermTree(){
  var container=document.getElementById('perm-tree-container');
  if(container) container.innerHTML=buildPermTreeHTML();
}
function collectPerms(){
  var perms={};
  collectLeafPerms(permTreeData);
  function collectLeafPerms(nodes){
    nodes.forEach(function(n){
      if(n.children&&n.children.length){collectLeafPerms(n.children);}
      else{perms[n.id]=tempPerms[n.id]?1:0;}
    });
  }
  return perms;
}
function openRoleEdit(isNew,code){
  var r=null;
  if(!isNew){r=roleList.find(function(x){return x.code===code;});if(!r)return;}
  var title=isNew?'添加角色':'编辑角色 - '+(r?r.name:'');
  var name=r?r.name:'',rcode=r?r.code:'',desc=r?r.desc:'',rstatus=r?r.status:1;
  tempPerms={};
  if(r&&r.perms){Object.keys(r.perms).forEach(function(k){tempPerms[k]=r.perms[k];});}
  var body='<div class="ant-row"><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>角色名称</div><input class="ant-input" id="reName" value="'+name+'" placeholder="请输入角色名称"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>角色编码</div><input class="ant-input" id="reCode" value="'+rcode+'" placeholder="请输入角色编码（唯一）"'+(isNew?'':' readonly style="background:#f5f5f5"')+'></div></div><div class="ant-form-item"><div class="ant-form-label">描述</div><textarea class="ant-input" id="reDesc" placeholder="请简要描述该角色" rows="2">'+desc+'</textarea></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>角色权限</div><div id="perm-tree-container">'+buildPermTreeHTML()+'</div></div><div class="ant-form-item"><div class="ant-form-label">状态</div><div style="padding:8px 0;"><label style="display:inline-flex;align-items:center;gap:4px;margin-right:24px;cursor:pointer;"><input type="radio" name="reStatus" value="1"'+(rstatus===1?' checked':'')+'> 启用</label><label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;"><input type="radio" name="reStatus" value="0"'+(rstatus===0?' checked':'')+'> 禁用</label></div></div>';
  var footer='<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="'+(isNew?'saveNewRole()':'saveEditRole(\''+code+'\')')+'">保存</button>';
  openModal(title,body,footer);
}
function saveNewRole(){
  var name=document.getElementById('reName').value.trim();
  var code=document.getElementById('reCode').value.trim();
  var desc=document.getElementById('reDesc').value.trim();
  if(!name) return toast('请输入<span style="color:var(--danger);">角色名称</span>');
  if(!code) return toast('请输入<span style="color:var(--danger);">角色编码</span>');
  if(roleList.some(function(x){return x.code===code;})) return toast('角色编码 <span style="color:var(--danger);">'+code+'</span> 已存在，请更换');
  var statusEl=document.querySelector('input[name="reStatus"]:checked');
  var st=statusEl?parseInt(statusEl.value):1;
  var perms=collectPerms();
  roleList.push({code:code,name:name,builtin:false,status:st,desc:desc||'-',time:new Date().toISOString().slice(0,10),perms:perms});
  closeModal();toast('角色 <span style="color:var(--danger);">'+name+'</span> 添加成功');renderContent();
}
function saveEditRole(code){
  var name=document.getElementById('reName').value.trim();
  var desc=document.getElementById('reDesc').value.trim();
  if(!name) return toast('请输入<span style="color:var(--danger);">角色名称</span>');
  var r=roleList.find(function(x){return x.code===code;});if(!r)return;
  var statusEl=document.querySelector('input[name="reStatus"]:checked');
  r.name=name;r.desc=desc||'-';r.status=statusEl?parseInt(statusEl.value):1;r.perms=collectPerms();
  closeModal();toast('角色 <span style="color:var(--danger);">'+name+'</span> 已更新');renderContent();
}
function toggleRoleStatus(code){
  var r=roleList.find(function(x){return x.code===code;});if(!r)return;
  r.status=r.status?0:1;
  toast('角色 <span style="color:var(--danger);">'+r.name+'</span> 已'+(r.status?'启用':'禁用'));
  renderContent();
}
function deleteRole(code){
  var r=roleList.find(function(x){return x.code===code;});if(!r)return;
  if(r.builtin) return toast('内置角色不可删除');
  roleList=roleList.filter(function(x){return x.code!==code;});
  toast('角色 <span style="color:var(--danger);">'+r.name+'</span> 已删除');renderContent();
}


// ── 个人中心 ──
var profile={uid:'U20260527001',name:'张运营',phone:'138****8888',email:'zhangyy@example.com',realName:'张运',realIdCard:'3201**********1234',realVerified:true,alipayName:'张运',alipayIdCard:'3201**********1234',alipayAccount:'138****8888',alipayBound:true};

function openProfileCenter(){
  var h='';
  h+='<div style="display:flex;gap:40px;margin-bottom:20px;"><div style="color:var(--text-secondary);">姓名：<span style="color:var(--text);">'+profile.name+'</span></div><div style="color:var(--text-secondary);">用户编号：<span style="color:var(--text);">'+profile.uid+'</span></div></div>';

  h+='<div style="margin:20px 0;border-top:1px solid var(--border-light);"></div>';

  h+='<div class="bind-item"><div class="bind-info"><div class="bind-label">手机号</div><div class="bind-val">'+profile.phone+'</div></div><div class="bind-action"><button class="ant-btn ant-btn-sm" onclick="openBindPhone()">更换绑定</button></div></div>';
  h+='<div class="bind-item"><div class="bind-info"><div class="bind-label">邮箱</div><div class="bind-val">'+profile.email+'</div></div><div class="bind-action"><button class="ant-btn ant-btn-sm" onclick="openBindEmail()">更换绑定</button></div></div>';

  h+='<div style="margin:20px 0;border-top:1px solid var(--border-light);"></div>';

  // 实名认证
  if(profile.realVerified){
    h+='<div class="bind-item"><div class="bind-info"><div class="bind-label">实名认证 <span style="font-size:11px;color:var(--success);">✓ 已认证</span></div><div class="bind-val">真实姓名：'+profile.realName+'</div><div class="bind-val">身份证号：'+profile.realIdCard+'</div></div><div class="bind-action"><span style="color:var(--text-tertiary);font-size:12px;">已认证</span></div></div>';
  }else{
    h+='<div class="bind-item"><div class="bind-info"><div class="bind-label">实名认证 <span style="font-size:11px;color:var(--danger);">未认证</span></div><div class="bind-val" style="color:var(--text-tertiary);">为保障账户安全和提现功能，请完成实名认证</div></div><div class="bind-action"><button class="ant-btn ant-btn-primary ant-btn-sm" onclick="openVerifyIdentity()">去认证</button></div></div>';
  }

  h+='<div style="margin:20px 0;border-top:1px solid var(--border-light);"></div>';

  if(profile.alipayBound){
    h+='<div class="bind-item"><div class="bind-info"><div class="bind-label">支付宝账号</div><div class="bind-val">真实姓名：'+profile.alipayName+'</div><div class="bind-val">身份证号：'+profile.alipayIdCard+'</div><div class="bind-val">账号：'+profile.alipayAccount+'</div></div><div class="bind-action"><button class="ant-btn ant-btn-danger ant-btn-sm" onclick="unbindAlipay()">解绑</button></div></div>';
  }else{
    h+='<div class="bind-item"><div class="bind-info"><div class="bind-label">支付宝账号</div><div class="bind-val" style="color:var(--text-tertiary);">暂未绑定支付宝账号</div></div><div class="bind-action"><button class="ant-btn ant-btn-primary ant-btn-sm" onclick="openBindAlipay()">绑定账号</button></div></div>';
  }

  h+='<div style="margin:20px 0;border-top:1px solid var(--border-light);"></div>';
  h+='<div class="bind-item"><div class="bind-info"><div class="bind-label">登录密码</div><div class="bind-val">******</div></div><div class="bind-action"><button class="ant-btn ant-btn-sm" onclick="openChangePassword()">修改密码</button></div></div>';

  openModal('个人中心',h,'<button class="ant-btn" onclick="closeModal()">关闭</button>');
}

function openVerifyIdentity(){
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>真实姓名</div><input class="ant-input" id="verifyName" placeholder="请输入身份证姓名"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>身份证号</div><input class="ant-input" id="verifyIdCard" placeholder="请输入18位身份证号"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>手机验证码</div><div style="display:flex;gap:8px;"><input class="ant-input" id="verifyCode" placeholder="请输入验证码" style="flex:1;"><button class="ant-btn" onclick="toast(\'验证码已发送至 '+profile.phone+'\')">获取验证码</button></div></div>';
  openModal('🔒 实名认证',body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="confirmVerifyIdentity()">提交认证</button>');
}
function confirmVerifyIdentity(){
  var n=document.getElementById('verifyName').value.trim();
  var id=document.getElementById('verifyIdCard').value.trim();
  var code=document.getElementById('verifyCode').value.trim();
  if(!n) return toast('请输入真实姓名');
  if(!id||id.length!==18) return toast('请输入正确的18位身份证号');
  if(!code||code!=='8888') return toast('验证码错误');
  profile.realName=n;
  profile.realIdCard=id.replace(/(\d{4})\d{10}(\d{4})/,'$1**********$2');
  profile.realVerified=true;
  toast('✓ 实名认证成功');
  closeModal();
  openProfileCenter();
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
function openChangePassword(){
  var body='<div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>当前密码</div><input class="ant-input" id="cpOld" type="password" placeholder="请输入当前密码"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>新密码</div><input class="ant-input" id="cpNew" type="password" placeholder="请输入新密码"></div><div class="ant-form-item"><div class="ant-form-label"><span class="req">*</span>确认新密码</div><input class="ant-input" id="cpNew2" type="password" placeholder="请再次输入新密码"></div>';
  openModal('修改密码',body,'<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="confirmChangePassword()">确认修改</button>');
}
function confirmChangePassword(){
  var oldPwd=document.getElementById('cpOld').value;
  var newPwd=document.getElementById('cpNew').value;
  var newPwd2=document.getElementById('cpNew2').value;
  if(!oldPwd) return toast('请输入<span style="color:var(--danger);">当前密码</span>');
  if(!newPwd) return toast('请输入<span style="color:var(--danger);">新密码</span>');
  if(newPwd!==newPwd2) return toast('两次输入的<span style="color:var(--danger);">新密码不一致</span>');
  if(oldPwd!=='123456') return toast('<span style="color:var(--danger);">当前密码错误</span>');
  if(oldPwd===newPwd) return toast('新密码不能与<span style="color:var(--danger);">当前密码</span>相同');
  toast('密码修改成功');
  closeModal();
}

function openIterRecords(){
  openModal('📋 迭代记录','<div style="max-height:60vh;overflow-y:auto;"><p style="color:var(--text-tertiary);">加载中...</p></div>','<button class="ant-btn" onclick="closeModal()">关闭</button>');
  var body=document.querySelector('#modal-box .modal-body');
  var h='<div class="iter-timeline">';
  fetch('iteration-records.json?'+Date.now()).then(function(r){return r.json();}).then(function(data){
    data.forEach(function(item){
      var sc=item.status==='开发中'?'draft':'released';
      h+='<div class="iter-item"><div class="iter-dot '+sc+'"></div><div class="iter-head"><span class="iter-ver">'+item.version+'</span><span class="iter-date">'+item.date+'</span><span class="iter-status '+sc+'">'+item.status+'</span></div><ul class="iter-changes">';
      item.changes.forEach(function(c){
        h+='<li><span class="iter-type">'+c.type+'</span> '+c.content+'</li>';
      });
      h+='</ul></div>';
    });
    h+='</div>';
    body.innerHTML=h;
  }).catch(function(){
    body.innerHTML='<p style="color:var(--text-secondary);">加载迭代记录失败</p>';
  });
}

// ── INIT ──
renderTree();
renderContent();