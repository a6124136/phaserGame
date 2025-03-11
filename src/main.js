// import './style.css'
// import Phaser, { Physics } from 'phaser'
// import { corpseBomb } from './attackAndSkill'
// 沒想到越寫越多功能，應該一開始就分類的
// -----------------------------------------
export  {GameScene}
const size={
  //遊戲canvas視窗大小
  width:1200,
  height:650
}

// dom切換面板--------------------------
const gameStartDiv=document.getElementById('gameStartDiv')
const gameStartBTN=document.getElementById('gameStartBTN')
const gameEndDiv=document.getElementById('gameEndDiv')
const gameWinLoseSpan=document.getElementById('gameWinLoseSpan')
const gameEndScoreSpan=document.getElementById('gameEndScoreSpan')
const gameEndImage=document.getElementById('gameEndImg')
// dom切換面板--------------------------

class GameScene extends Phaser.Scene{

  // 繼承構造體
  constructor(){
    super("scene-game")//init遊戲場景
    this.player
    this.playerConfig={
      // 玩家初始屬性
      speed:300,
      life:100,
      lifeRemain:100,
      // 生命上限跟剩餘生命
      str:10,
      expRequire:30,
      lv:1
    }
    this.lvText// 顯示玩家等級的文字
    this.exp=0//當前經驗值
    this.enemyRH//兔頭
    this.isActive=false
    // 是否移動，決定待機或行動狀態
    this.isAttacking=false
    // 是否正在攻擊或施放技能，執行動作後才能執行其他動作
    this.die=false
    // 玩家是否死亡的判斷
    this.enemies
    //敵人群組
    this.enemySpawnTime=2000
    // 生小兵速率，起始兩秒間隔
    this.enemyConfig={
      //敵人初始屬性
      speed:50,
      life:30,
      str:10,
      exp:10
    }
    this.soliders
    //小兵的群組
    this.soliderConfig={
      limit:3,//召喚上限
      life:80,
      lifeRemain:80,
      str:10,
      iamSuperSolider:false//判斷這個小兵是不是大兵
      // 小兵繼承玩家部分屬性
    }
    this.solidersNumber=0
    //當前的小兵數量，可進行刪減，不能超過soliderConfig內的上限
    this.superSoliderExist=false//判斷當前的小兵群體內有沒有大兵，預設沒有
    this.attackRange
    //攻擊範圍

    // 技能圖標
    this.skillAicon
    this.skillBicon
    this.skillCicon
    // 技能圖標

    // 技能等級
    this.skillAmaster=false
    this.skillBmaster=false
    this.skillCmaster=false
    //是否學會各項技能
    this.bombRange //屍體爆破技能範圍
    this.skillBcast=false //正在施展2技能

    //音樂變數
    this.music
  }
  // ------------------------預先載入素材--------------------------------------------------------
  preload(){
    this.load.image('bg','./assets/map.jpg')
    this.load.image('enemyRH','./assets/rabbitHead.png')
    this.load.spritesheet('player','./assets/player/playerDefault.png', { frameWidth: 200, frameHeight: 200 })
    this.load.spritesheet('attack','./assets/player/attack.png', { frameWidth: 200, frameHeight: 200 })
    this.load.spritesheet('move','./assets/player/move.png', { frameWidth: 200, frameHeight: 200 })
    this.load.spritesheet('die','./assets/player/dead.png', { frameWidth: 200, frameHeight: 200 })
    this.load.spritesheet('solider','./assets/solider.png', { frameWidth: 200, frameHeight: 200 })
    this.load.spritesheet('superSolider','./assets/superSolider.png', { frameWidth: 300, frameHeight: 300 })
    // 技能圖示
    this.load.image('skillA','./assets/skill/skillA.png')
    this.load.image('skillB','./assets/skill/skillB.png')
    this.load.image('skillC','./assets/skill/skillC.png')
    //技能圖示
    this.load.spritesheet('bomb','./assets/skill/bomb.png',{frameWidth:200,frameHeight:125})
    this.load.spritesheet('attackSkill','./assets/skill/attackAnime.png',{frameWidth:300,frameHeight:150})

    //背景音樂
    this.load.audio('bgm','./assets/BGM/bgm.mp3')
  }
  // -------------------------生成素材---------------------------------------------------------
  create(){
    this.scene.pause("scene-game")
    //先暫停，直到按下按鈕觸發scene-game後結束
    this.music=this.sound.add('bgm',{loop:true})
    this.music.play()
     // 顯示等級狀況--------------------------------------------
    this.lvText=this.add.text(
      size.width/2-70,0,`愛布拉娜等級:${this.playerConfig.lv}`,
      {
      font: '36px Arial',
      fill: '#fff',
      stroke: '#000000',
      strokeThickness: 4
    }).setDepth(2)
    // setDepth把層級往上提升才能看的到字
    this.lvText.setInteractive
    this.lvText.on('pointerdown',()=>{
      this.lvText.setScale(2)
    })
    // 背景-------------------------------------
    this.add.image(0,0,'bg').setOrigin(0,0)
    // 玩家-----------------------------------------
    this.player=this.physics.add.sprite(500,250,'player')
    this.player.setCollideWorldBounds(true)
    // 確保不超出邊界
    this.player.setInteractive
    this.player.on('pointerdown',()=>{this.skillUiHiden=false})

    this.lifeBar = this.add.graphics();
    // 用於繪制血量條的 Graphics 物件
    this.drawLifeBar(this.player);
    // 初始時呼叫繪制血量條函數，並且根據玩家當前的血量設定顏色

    this.anims.create({
      key:'playerDefault',
      frames:this.anims.generateFrameNames('player',{start:0,end:59}),
      frameRate:10,
      repeat:-1
    })
    // 玩家待機動畫

    this.anims.create({
      key:'playerAttack',
      frames:this.anims.generateFrameNames('attack',{start:0,end:18}),
      frameRate:30,
      repeat:0
      // 不重複，按一下打一下
    })
    // 玩家攻擊動畫

    this.anims.create({
      key:'playerMove',
      frames:this.anims.generateFrameNames('move',{start:1,end:30}),
      frameRate:40,
      repeat:-1
    })
    // 玩家移動動畫

    this.anims.create({
      key:'playerDie',
      frames:this.anims.generateFrameNames('die',{start:1,end:30}),
      frameRate:10,
      repeat:0
      // 死亡動畫不重複
    })

    this.anims.create({
      key:'soliderWalk',
      frames:this.anims.generateFrameNumbers('solider',{start:1,end:19}),
      frameRate:20,
      repeat:-1
      //小兵移動動畫
    })

    this.anims.create({
      key:'superSoliderWalk',
      frames:this.anims.generateFrameNumbers('superSolider',{start:1,end:19}),
      frameRate:20,
      repeat:-1
      //大兵移動動畫
    })

    this.anims.create({
      key:'corpseBomb',
      frames:this.anims.generateFrameNumbers('bomb',{start:1,end:9}),
      frameRate:20,
      repeat:0
      //爆炸只撥放一次
      // 屍體爆破動畫
    })
    this.anims.create({
      key:'attackAnime',
      frames:this.anims.generateFrameNumbers('attackSkill',{start:1,end:18}),
      frameRate:20,
      repeat:0
      //只撥放一次
      // 攻擊特效動畫
    })

    this.player.setSize(50,70).setOffset(this.player.width/2,this.player.height/3)
    //玩家碰撞箱
    this.cursor=this.input.keyboard.createCursorKeys();
    //偵查按鍵
    this.soliders=this.physics.add.group();
    // 創建小兵群組，生成新小兵

    this.enemies=this.physics.add.group();
    // 創建敵人的群組，新生成的敵人就塞進來
    //生成敵人的間隔
    this.time.addEvent({
        delay: this.enemySpawnTime,
        callback: this.spawnEnemy,
        callbackScope: this,
        loop: true  // 設定為循環生成敵人
    })

  }
  // ---------------------------畫面更新------------------------------------------------------
  update(){
    if(this.playerConfig.lifeRemain<=0){
      //玩家血量歸零時呼叫死亡動畫並結束遊戲
      this.playerDie()
      return
    }

    if(this.isAttacking){
      // 如果正在攻擊就不執行其他動作
      return
    }
    

    this.drawLifeBar()
    //隨時刷新血量
    this.lvText.setText(`愛布拉娜等級:${this.playerConfig.lv}`)
    //隨時刷新愛布拉娜當前等級
    
    // 每隔一段時間檢查玩家周圍範圍內的敵人是否死亡

    this.player.setVelocity(0);
    // 停止動作後取消向量
    if(!this.isActive){
      //沒有執行任何動作時就撥放待機
      this.player.anims.play('playerDefault',true)
    }

    // 移動的設定
    if (this.cursor.left.isDown) {
      this.isActive=true
      this.player.setVelocityX(-this.playerConfig.speed);  // 向左移動
      this.player.flipX=true //朝向左邊
      this.player.setSize(50,70).setOffset(this.player.width/3,this.player.height/3)
      this.player.anims.play('playerMove',true)
      
    } else if (this.cursor.right.isDown) {
      this.isActive=true
      this.player.setVelocityX(this.playerConfig.speed);  // 向右移動
      this.player.flipX=false //朝向右邊
      this.player.setSize(50,70).setOffset(this.player.width/2,this.player.height/3)
      this.player.anims.play('playerMove',true)
    }

    if(this.cursor.up.isDown) {
      this.isActive=true
      this.player.setVelocityY(-this.playerConfig.speed);  // 往上移動
      this.player.anims.play('playerMove',true)
    } else if(this.cursor.down.isDown){
      this.isActive=true
      this.player.setVelocityY(this.playerConfig.speed); //往下移動
      this.player.anims.play('playerMove',true)
    }
    
    if (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0) {
      this.isActive = false;
      // 停止動畫和設置默認動畫：
      // 當玩家沒行動(isActive==false)時，動畫會播放 playerDefault 動畫，並且設置 velocity 為 0，停止移動。
    }
    //預設待機動作 沒執行任何動作就回歸

    //攻擊、技能
    if (this.cursor.space.isDown && !this.isAttacking) {
      this.attack();//呼叫攻擊
    }


    //敵人行為邏輯
    this.enemies.getChildren().forEach(enemy => {
      // 讓每個敵人偵測並追蹤玩家
      if (enemy) {
          //每當敵人生成
          enemy.moveTowardsPlayer(enemy.moveToPlayerActive)
          //呼叫往玩家前進的函數，參考spawnEnemy說明
      }
    });

    this.soliders.getChildren().forEach(solider=>{
      if(solider.life>0){
        this.chaseEnemy(solider);
     // 沒死就觸發小兵追蹤敵人的行為
      }else{
        this.soliderDestroy(solider)
        // 死了就銷毀
      }
    })

    //---------------------------學技能的圖標-------------------------------------------
    if(this.playerConfig.lv>=10 && !this.skillAmaster){
      // 等級大於5且還沒學到技能A
      this.add.image(50,50,'skillA')
      this.skillAmaster=true
      // 學到了就打開技能
    }
    if(this.playerConfig.lv>=20 && !this.skillBmaster){
      // 等級大於5且還沒學到技能A
      this.add.image(150,50,'skillB')
      this.skillBmaster=true
      // 學到了就打開技能
    }
    if(this.playerConfig.lv>=30 && !this.skillCmaster){
      this.add.image(250,50,'skillC')
      this.skillCmaster=true
      // 學到了就打開技能
    }
    //---------------------------學技能的圖標-------------------------------------------
    //施展2技能
    if(this.skillBmaster&&!this.skillBcast){
      // 學完二技能 還沒施展
      this.skillBcast=true
      // 先把施展條件改為真
      this.sleepEnemy()
      //呼叫睡眠敵人，邏輯在這裏面處理
    }
    //施展2技能

  }

  attack(){
    this.isAttacking = true;  // 設置為正在攻擊狀態
    this.player.setVelocityX(0);  // 停止所有移動
    this.player.setVelocityY(0);

    this.createAttackRange()
    // 呼叫攻擊範圍的函數，範圍內有敵人會在觸發命中效果

    // 播放攻擊動畫，並在動畫播放完成後恢復移動
    this.player.anims.play('playerAttack', true).on('animationcomplete', () => {
        this.isAttacking = false;  // 動畫完成後設置為可以攻擊或移動
        this.player.anims.play('playerDefault', true);  // 恢復默認動畫
        this.removeAttackRange()
        // 動畫播完把碰撞箱清除
    });
  }

  // 檢查攻擊範圍
  createAttackRange() {
    
    const attackWidth = 200;  // 攻擊範圍的寬度
    const attackHeight = 100;  // 攻擊範圍的高度
    if (this.player.flipX) {
      // 攻擊範圍朝左
      this.attackRange = this.add.rectangle(
          this.player.x -this.player.width*1.2,  // 攻擊範圍偏移角色位置
          this.player.y,
          attackWidth,
          attackHeight,
          0xff0000,  // 顏色（紅色）
          0  // 透明度
      ).setOrigin(0, 0.5);  // 設置為從角色的左邊創建

      let anime=this.add.sprite(this.player.x -this.player.width*0.8,this.player.y,'attackSkill')
      anime.anims.play('attackAnime',true)
      anime.on('animationcomplete',()=>anime.destroy())
      //建立攻擊特效跟動畫 撥放結束後清除
    } else {
      // 攻擊範圍朝右
      this.attackRange = this.add.rectangle(
          this.player.x + this.player.width*1.2,  // 攻擊範圍偏移角色位置，大概一個角色身位的80%?
          this.player.y,
          attackWidth,
          attackHeight,
          0xff0000,  // 顏色（紅色）
          0  // 透明度
      ).setOrigin(1, 0.5);  // 設置為從角色的右邊創建

      let anime=this.add.sprite(this.player.x + this.player.width*0.8,this.player.y,'attackSkill')
      anime.flipX=true //翻轉一下朝向
      anime.anims.play('attackAnime',true)
      anime.on('animationcomplete',()=>anime.destroy())
      //建立攻擊特效跟動畫 撥放結束後清除
    }
    // 添加物理體系以使攻擊範圍參與碰撞檢測
    const attackRange=this.physics.add.existing(this.attackRange).setSize(attackWidth, attackHeight);  
    // 將矩形設置為具有物理體系的對象  
    // 判斷每個敵人是否有重疊
    this.enemies.getChildren().forEach((enemy)=>{
      if (this.physics.overlap(enemy, attackRange)) {
        // 如果重疊，則對該敵人進行處理
        this.hitEnemy(enemy);
      }
    })
  }

  //生成敵人函數
  spawnEnemy(){
    // 設置最小距離
    const minDistance = 200;
    let xPos, yPos, distance;

    // 隨機生成敵人位置
    do{

      xPos = Phaser.Math.Between(0, size.width);  // 隨機生成敵人在畫面內的 x 座標
      yPos = Phaser.Math.Between(0, size.height);  // 隨機生成敵人在畫面內的 y 座標
      distance = Phaser.Math.Distance.Between(xPos, yPos, this.player.x, this.player.y);
    }while(distance<minDistance)
      // 如果距離太近則重新生成

    // 創建敵人
    const enemy = this.physics.add.image(xPos, yPos, 'enemyRH');  // 假設 'enemy' 是預先載入的敵人精靈
    // 設定敵人的速度
    enemy.speed = this.enemyConfig.speed;  // 敵人的移動速度（可以根據需求調整）
    enemy.life=this.enemyConfig.life
    enemy.exp=this.enemyConfig.exp
    enemy.str=this.enemyConfig.str
    enemy.moveToPlayerActive=true
    //開啟自動找玩家的開關
    enemy.moveTowardsPlayer = function(e) {
      if(e){
        // 給敵人一個自動追蹤的函數作為屬性，後面要關閉或開啟比較方便
        // update()裡呼叫moveTowardsPlayer屬性時把另一個布爾值moveToPlayerActive當成參數控制敵人追蹤模式
        // 計算敵人與玩家之間的角度
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
    
        // 計算敵人朝玩家移動的速度
        const velocityX = Math.cos(angle) * this.speed;
        const velocityY = Math.sin(angle) * this.speed;
    
        // 設置敵人的速度，讓其朝玩家方向移動
        this.setVelocity(velocityX, velocityY);
        
        // 面對方向改變↓
        if (velocityX > 0) {
            this.flipX = true;
        } else {
            this.flipX = false;
        }
    }else if(!e){
      this.setVelocity(0)
      // 禁止移動時吧向量歸零
    };
  }

    // 將敵人加入到 enemies 群組
    this.enemies.add(enemy);


    let canTrigger=true
    // 設立可以觸發傷害為真
    const cdTime=1000
    // 再次觸發的延遲時間1000毫秒

    // 設定敵人碰到玩家造成傷害
    this.physics.add.collider(enemy, this.player, (enemy,player)=>{
      if(canTrigger){
        this.hitPlayer(enemy)
        canTrigger=false
        this.time.delayedCall(cdTime,()=>{
          canTrigger=true
        })

      }
    }, null, this);  
    // 設置敵人與玩家的碰撞檢測(有碰撞體積，邊界碰到觸發)，要傳參數只能使用lamda表達式呼叫hitPlayer


  }
  // 打中敵人
  hitEnemy(enemy){
    enemy.life-=this.playerConfig.str
    // console.log("怪物剩餘生命"+enemy.life)
    // 創建文字對象，並將其設置為敵人位置附近
    const damageText = this.add.text(enemy.x, enemy.y - 50, `-${this.playerConfig.str}`, {
      font: '32px Arial',
      fill: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, -1); // 設置文字出現在目標上方

    this.tweens.add({
      targets: damageText,
      y: damageText.y - 50,   // 向上移動50像素
      alpha: 0,               // 讓文字逐漸消失
      duration: 500,          // 持續時間500毫秒（即0.5秒）
      ease: 'Power1',         // 動畫的緩動效果
      onComplete: () => {
          damageText.destroy(); // 動畫結束後，刪除這個文字對象
      }
    });
    if(enemy.life<=0){
      this.enemyDestroy(enemy)
    }
  }

  // 被敵人打中
  hitPlayer(enemy){
    this.playerConfig.lifeRemain-=enemy.str
    // console.log(`玩家當前生命值: ${this.playerConfig.lifeRemain}生命值`);

    const damageText = this.add.text(this.player.x, this.player.y - 50, `-${this.playerConfig.str}`, {
      font: '32px Arial',
      fill: '#ffAA00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, -1); // 設置文字出現在目標上方

    this.tweens.add({
      targets: damageText,
      y: damageText.y - 50,   // 向上移動50像素
      alpha: 0,               // 讓文字逐漸消失
      duration: 500,          // 持續時間500毫秒（即0.5秒）
      ease: 'Power1',         // 動畫的緩動效果
      onComplete: () => {
          damageText.destroy(); // 動畫結束後，刪除這個文字對象
      }
    });
  }

  //小兵與敵人戰鬥邏輯 
  soliderVsEnemy(solider,enemies){
    solider.life-=enemies.str
    enemies.life-=solider.str
    // console.log(solider.life,enemies.life)

    //小兵頭上出現被打的傷害
    const soliderDamageText = this.add.text(solider.x, solider.y - 50, `-${enemies.str}`, {
      font: '32px Arial',
      fill: '#ffAA00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, -1); // 設置文字出現在目標上方

    this.tweens.add({
      targets: soliderDamageText,
      y: soliderDamageText.y - 50,   // 向上移動50像素
      alpha: 0,               // 讓文字逐漸消失
      duration: 500,          // 持續時間500毫秒（即0.5秒）
      ease: 'Power1',         // 動畫的緩動效果
      onComplete: () => {
        soliderDamageText.destroy(); // 動畫結束後，刪除這個文字對象
      }
    });
    // 怪物受到小兵傷害的數字
    const enemyDamageText = this.add.text(enemies.x, enemies.y - 50, `-${solider.str}`, {
      font: '32px Arial',
      fill: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, -1); // 設置文字出現在目標上方

    this.tweens.add({
      targets: enemyDamageText,
      y: enemyDamageText.y - 50,   // 向上移動50像素
      alpha: 0,               // 讓文字逐漸消失
      duration: 500,          // 持續時間500毫秒（即0.5秒）
      ease: 'Power1',         // 動畫的緩動效果
      onComplete: () => {
        enemyDamageText.destroy(); // 動畫結束後，刪除這個文字對象
      }
    });
    if(enemies.life<=0){
      this.enemyDestroy(enemies)
    }else if(solider.life<=0){
      this.soliderDestroy(solider)
    }
  }
  //生成小兵，包含生成大兵邏輯
  createSolider(){
    // 敵人死亡時會進行一次距離玩家的判斷，在距離內就呼叫這個函數生成小兵
    // console.log("召喚小小兵")
    
    if(this.solidersNumber==this.soliderConfig.limit){
      //假設達到小兵當前上限就返回不增加士兵
      return
    }
    this.solidersNumber++
    //計算當前小兵數量
    
     // 在玩家周圍的某個隨機位置生成友方 AI 單位
     const spawnX = this.player.x + Phaser.Math.Between(-100, 100);  // 隨機生成範圍
     const spawnY = this.player.y + Phaser.Math.Between(-100, 100);  // 隨機生成範圍
    
    var solider //創建小兵變數，還沒決定要召喚特殊兵還是普通小兵
     // 生成友方單位並將其添加到友方群組

    if(this.skillCmaster&&!this.superSoliderExist){
      // 條件 學會召喚大兵，且場上沒有大兵

    this.superSoliderExist=true
    //打開Flag 把場上已有大兵存在寫入狀態
    solider = this.physics.add.sprite(spawnX, spawnY, 'superSolider');
    // 加入大兵精靈影格
    solider.str=this.soliderConfig.str*4
    solider.life=this.soliderConfig.life*4
    solider.lifeRemain=this.soliderConfig.lifeRemain*4
    solider.anims.play('superSoliderWalk',true)
    solider.iamSuperSolider=true
    //確認這個單位是大兵
    // 播放大兵動畫
    solider.setSize(120,120)//尺寸
    solider.setOffset(100,100)//碰撞箱偏移到正確尺寸
    // 配置士兵各項屬性

    }else if (!this.skillCmaster||(this.skillCmaster&&this.superSoliderExist)){
      // 條件 沒學會召喚大兵技能，或學會了但是場上已有大兵
      solider = this.physics.add.sprite(spawnX, spawnY, 'solider');
    // 加入小兵精靈影格
    solider.str=this.soliderConfig.str
    solider.life=this.soliderConfig.life
    solider.lifeRemain=this.soliderConfig.lifeRemain
    solider.anims.play('soliderWalk',true)
    solider.iamSuperSolider=false
    //召喚普通小兵
    // 播放小兵動畫
    solider.setSize(80,80)//尺寸
    solider.setOffset(70,80)//碰撞箱偏移到正確尺寸
    // 配置士兵各項屬性

    }
    
    this.soliders.add(solider)
    //加入小兵群組

    let canTrigger=true
    // 設立可以觸發傷害為真
    const cdTime=1000
    // 再次觸發的延遲時間1000毫秒

    // 設定敵人碰撞到小兵互相傷害
    this.physics.add.collider(this.soliders, this.enemies, (solider,enemy)=>{
      if(canTrigger){
        this.soliderVsEnemy(solider,enemy)
        canTrigger=false
        this.time.delayedCall(cdTime,()=>{
          canTrigger=true
        })

      }
    }, null, this);  
    // 設置敵人與小兵的碰撞檢測(有碰撞體積，邊界碰到觸發)
  }

  //小兵追蹤邏輯
  chaseEnemy(solider){
    // 每 100 毫秒檢查一次最近的敵人
    let movement = this.time.addEvent({
      delay: 100,
      callback: () => {
        if (!solider.active) {
          // 如果 士兵 已經被銷毀，則停止移動
          movement.remove();
          return;
      }

          let nearestEnemy = this.findNearestEnemy(solider);
          // 讓尋找最近敵人的函數回傳一個最近的敵人回來當成參數，不停修正離自己最近的敵人
          if (nearestEnemy) {
              // 讓友方單位向最近的敵人移動
              this.physics.moveToObject(solider, nearestEnemy, 100);  // 100 是移動速度
          }
          // console.log(solider.body.velocity.x) 判斷士兵當前的移動朝向
          if(solider.body.velocity.x<0){
            solider.flipX=true
          }else{
            solider.flipX=false
          }
      },
      loop: true
    });
  }
  //輔助小兵追蹤敵人邏輯，找到最近的
  findNearestEnemy(ally) {
    let nearestEnemy = null;
    let shortestDistance = Number.MAX_VALUE;  // 設定一個非常大的數值

    // 遍歷敵人群組，找出最近的敵人
    this.enemies.getChildren().forEach(enemy => {
        let distance = Phaser.Math.Distance.Between(ally.x, ally.y, enemy.x, enemy.y);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            // 把最大數字不斷取代成當前最小路徑去判斷追誰
            nearestEnemy = enemy;
        }
    });

    return nearestEnemy;
  }

  //繪製血量條
  drawLifeBar() {
    // 清空先前的繪制
    this.lifeBar.clear();

    // 設定血量條的位置
    const barX = this.player.x +20;  //調整一下偏移
    const barY = this.player.y - 60; // 顯示在玩家頭上方

    // 設定血量條的大小
    const barWidth = 80; // 血量條的寬度
    const barHeight = 10; // 血量條的高度

    // 計算綠色（剩餘血量）的寬度
    const greenWidth = (this.playerConfig.lifeRemain / this.playerConfig.life) * barWidth;
    // 計算紅色（扣除血量）的寬度
    const redWidth = barWidth - greenWidth;

    // 繪制紅色部分（被扣除的血量）
    this.lifeBar.fillStyle(0xff0000); // 紅色
    this.lifeBar.fillRect(barX - barWidth / 2, barY, redWidth, barHeight);

    // 繪制綠色部分（剩餘的血量）
    this.lifeBar.fillStyle(0x00ff00); // 綠色
    this.lifeBar.fillRect(barX - barWidth / 2 + redWidth, barY, greenWidth, barHeight);
  }

  //玩家死亡函數
  playerDie(){
    this.die = true;  // 設置為死亡狀態
    this.player.setVelocityX(0);  // 停止所有移動
    this.player.setVelocityY(0);
    
    this.enemies.getChildren().forEach((enemy)=>{
      enemy.removeAllListeners
      // 所有敵人終止追蹤
    })
  
    // 播放死亡動畫，並在動畫播放完成後結束遊戲
    this.player.anims.play('playerDie', true).on('animationcomplete', () => {
        this.die = false;  // 死亡動畫完成後解除限制
        this.gameOver()
        //結束遊戲
    });
  }

  // 移除攻擊範圍的碰撞箱
  removeAttackRange() {
    if (this.attackRange) {
      // 如果產生攻擊範圍的BOX
        this.attackRange.destroy();  // 移除攻擊範圍
        this.attackRange = null;
    }
  }
  //敵人被打死時呼叫死亡函數
  enemyDestroy(enemy){
    this.exp+=this.enemyConfig.exp
    //殺死敵人後得到經驗值
    
    if(this.exp>this.playerConfig.expRequire&&this.playerConfig.lv<100){
      //設置100等級上限
      this.levelUp()
      //經驗值大於需求後呼叫升級
    }

    const detectionRadius = 200;  // 200 像素範圍內
    // 敵人死亡時判斷是否在玩家周圍
    this.enemies.getChildren().forEach((enemy)=>{
        const distance=Phaser.Math.Distance.Between(this.player.x,this.player.y,enemy.x,enemy.y)
        ///Phaser內建的距離檢測
        
        if(distance<=detectionRadius){
          // console.log("範圍內死亡"+distance+"距離")
          this.createSolider()
        }
    })
    
    enemy.destroy()
  }
  //小兵被打死時呼叫死亡函數
  soliderDestroy(solider){
    solider.destroy()
    this.solidersNumber--
    //把在場士兵數量扣回去，維持上限
    if(this.skillAmaster){
      //學會技能A才能觸發爆炸傷害
      this.corpseBomb(solider)
    }
    if(solider.iamSuperSolider){
      // 當前死亡的是大兵
      this.superSoliderExist=false
      // 將場上有大兵的狀態改回沒有
    }
  }
  
  //技能A屍體爆炸
  corpseBomb(solider){
    const bombAria =  100
    this.bombRange=this.add.circle(solider.x,solider.y,bombAria,0xAAA,0.5)
    // 創建一個圓形範圍，以小兵為中心，100半徑，顏色，透明度

    // console.log("小兵死亡座標:"+solider.x+":"+solider.y)

    // 添加物理體系以使攻擊範圍參與碰撞檢測
    const effectAria=this.physics.add.existing(this.bombRange);  
    
    let bombAnime = this.add.sprite(solider.x,solider.y,'bomb')
    //在小兵座標產生爆炸動畫
    bombAnime.anims.play('corpseBomb', true).on('animationcomplete',()=>{
      bombAnime.destroy()
      //播完動畫後銷毀
    })
    
    this.enemies.getChildren().forEach((enemy)=>{
      if (this.physics.overlap(enemy, effectAria)) {
        // 如果敵人在攻擊範圍內，則對該敵人進行傷害處理
        this.hitEnemy(enemy)
      }
    })
    if(this.bombRange){
      this.bombRange.destroy()
      //清除爆炸範圍
    }
  }
  //技能B 沉睡敵人
  sleepEnemy(){
      // console.log("施展2技能，沒錯的話應該只會跳一次測試成功")

      // 註冊一個每隔14秒循環一次的技能
      this.time.addEvent({
        delay:14000,
        callback:()=>{
          // console.log("這個訊息每隔14秒跳一次")
          const twoEnemy = this.physics.add.group()//創立一個臨時的敵人群組，放兩個最近的敵人
          this.enemies.getChildren().forEach(enemy=>{
            let distance=Phaser.Math.Distance.Between(this.player.x,this.player.y,enemy.x,enemy.y)
            //每個敵人計算與玩家的距離
            twoEnemy.getChildren().push({enemy:enemy,distance:distance})
            // 把所有敵人加入還有當下的距離加入這個臨時群組，屬性用{敵人:第幾個敵人，距離:距離多遠}加入
          })
          twoEnemy.getChildren().sort((a,b)=>{a.distance-b.distance})
          // 比較前後項的距離屬性排序，從小到大
          twoEnemy.getChildren().slice(0,2)
          // 只保留前兩個敵人(以排序過最近的距離前兩名)
          twoEnemy.getChildren().forEach(e=>{
            // this.hitEnemy(e.enemy)//注意包裝的格式 ，twoEnemy一個children裏面包含了enemy跟distence 要呼叫e.enemy才是對的
            this.hitEnemy(e.enemy)
            //呼叫一次傷害
            e.enemy.moveToPlayerActive=false
            // 關閉尋找玩家的屬性，參考spawnEnemy的寫法
            this.time.addEvent({
              delay:2000,
              callback:()=>{e.enemy.moveToPlayerActive=true},
              loop:false
              //2秒後被沉睡的敵人甦醒
            })

            // 被睡著的敵人頭上出現ZZZ文字
            const zzzText = this.add.text(e.enemy.x, e.enemy.y - 50, `zzZZZ`, {
              font: '32px Arial',
              fill: '#ff00bb',
              stroke: '#000000',
              strokeThickness: 4
            }).setOrigin(0, -1); // 設置文字出現在目標上方
        
            this.tweens.add({
              targets: zzzText,
              y: zzzText.y - 50,   // 向上移動50像素
              alpha: 0,               // 讓文字逐漸消失
              duration: 3000,          // 持續時間1.5秒
              ease: 'Power1',         // 動畫的緩動效果
              onComplete: () => {
                  zzzText.destroy(); // 動畫結束後，刪除這個文字對象
              }
            });
            
          })
        },
        loop:true
      })
  }

  // LV升級
  levelUp(){
    if(this.die){
      //加條件判斷，死亡後觸發升級不會因為回滿血出bug
      return
    }
    if(this.playerConfig.lv==100){
      return
    }
    
    this.playerConfig.lv++
    this.playerConfig.life+=10
    this.playerConfig.lifeRemain=this.playerConfig.life
    // 血量上限提升，血量回滿
    this.playerConfig.str+=1
    // 增加攻擊力，等級
    this.playerConfig.expRequire=this.playerConfig.expRequire*1.2
    // 經驗值需求等比上升
    // console.log(`當前經驗值${this.exp}，下一等級要${this.playerConfig.expRequire}`)
    // console.log(`當前玩家血量${this.playerConfig.life}`)

    this.enemyConfig.life+=13
    this.enemyConfig.speed+=0.5 //敵人移動速度上升
    this.enemyConfig.str+=3
    this.enemyConfig.exp+=this.enemyConfig.exp*1.1
    this.enemySpawnTime-=120 //敵人生怪速率上升 
    
    // 血量、速度、攻擊力、獲取經驗值上升
    // 隨著等級升高，獲取的攻擊力、血量會變少，但怪物成長幅度更高
    this.soliderConfig.life+=10
    this.soliderConfig.str+=1
    // console.log(`當前怪物血量:${this.enemyConfig.life}傷害:${this.enemyConfig.str}速度:${this.enemyConfig.speed}`)
    // console.log(`當前小兵血量:${this.soliderConfig.life}傷害:${this.soliderConfig.str}`)

  }
  //遊戲結束
  gameOver(){
    // 遊戲結束
    
    this.sys.game.destroy(true)
    if(this.playerConfig.lv>=70){
      gameWinLoseSpan.textContent="真的超大杯(指的是強度)"
      gameEndScoreSpan.textContent="玩家手部乘區比設計師強多了"
      gameEndImage.src="./public/assets/gameImg/超大杯配圖.jpg"
    }else if(this.playerConfig.lv>45&&this.playerConfig.lv<70){
      gameWinLoseSpan.textContent="大杯"
      gameEndScoreSpan.textContent="調整歸來仍是個大杯"
      gameEndImage.src="./public/assets/gameImg/大杯配圖.jpg"
    }else if(this.playerConfig.lv<=45){
      gameWinLoseSpan.textContent="中杯"
      gameWinLoseSpan.textContent="幹員是中杯，但你的小杯操作彌補了這點"
      gameEndImage.src="./public/assets/gameImg/中杯配圖.jpg"
    }

    gameEndDiv.style.display="flex"
  }

  //呼叫內部屬性的辦法 
  getProp(){
    return this.soliderConfig
  }
}



const config = {
  type:Phaser.auto,
  width:size.width,
  height:size.height,
  canvas:gameCanvas,
  physics:{
    default:"arcade",
    arcade:{
      gravity:0,
      debug:false
      // debug會有些輔助畫面，像是物件外輪廓線的紫色框，向量移動的綠色線
    }
  },
  scene:[GameScene]
}

const game= new Phaser.Game(config)


// const gameConfig=new GameScene()
//建立instance才可以使用emmit修改屬性
// game.events.on('skillUp', () => {
//   game.scene.sleep('learnSkill')
//   game.scene.resume('scene-game')
//   console.log("觸發emit")

// });
// 註冊一個事件

gameStartBTN.addEventListener('click',()=>{
  gameStartDiv.style.display="none"
  game.scene.resume("scene-game")
  // 啟動遊戲
  // game.scene.start('learnSkill')

})