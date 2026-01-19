class Rect {
  constructor(x,y,w,h){
    this.xPos = x;
    this.yPos = y;
    this.w = w;
    this.h = h;
  }
  top(){
    return this.yPos;
  }
  bottom(){
    return this.yPos + this.h;
  }
  right(){
    return this.xPos + this.w;
  }
  left(){
    return this.xPos;
  }
  centerX(){
    return this.xPos + (this.w / 2.0);
  }
  centerY(){
    return this.yPos + (this.h / 2.0);
  }
}

class PhysicsRect extends Rect {
  constructor(x,y,w,h){
    super(x,y,w,h);
    this.prevX = x;
    this.prevY = y;
  }
}

class GameImage {
  loadImage(path){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = path;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }
  async loadImagesFromFolder(path,count){
    const imgs = [];
    for(i=0; i<count; i++){
      try{
      const img = await this.loadImage(path + i +".png");
        imgs.push(img);
      }catch {
        console.log("Cannot load the Image :" + path + i +".png");
      }
    }
    return imgs;
  }
}

class RenderOffset {
  constructor(x,y,w,h) {
    this.xPos = x;
    this.yPos = y;
    this.w = w;
    this.h = h;
  }
  setOffsets(x,y,w,h){
    this.xPos = x;
    this.yPos = y;
    this.w = w;
    this.h = h;
  }
  reset(){
    this.xPos = 0;
    this.yPos = 0;
    this.w = 0;
    this.h = 0;
  }
}

class Layer{
  img;
  depth;
  renderOffset = new RenderOffset(0,0,0,0);
  constructor(img,x,y,layer, game){
    this.img = img;
    this.xPos = x;
    this.yPos = y;
    this.w = this.img.width;
    this.h = this.img.height +40;
    this.copyxPos = x + this.w;
    this.copyyPos = this.y;
    this.depth = layer+1;
    this.depthFactorY = 0.3*(1.0/this.depth);
    this.game = game
    this.wrapX = 0;
    this.wrapY = 0;
    this.screenX = 0;
    this.screenY = 0;
    this.wrapW = this.game.vCanvas.width;
  }
  render(ctx){
    //Calculating wrap x,y so the image loops
    //for real
    this.screenX = this.xPos + (this.game.camera.cameraOffsetX * (1/this.depth *0.5));
    this.wrapX = ((this.screenX %  this.wrapW) + this.wrapW) % this.wrapW;
    
    ctx.drawImage(
      this.img,
      this.wrapX - this.w + this.renderOffset.xPos,
    0 + (game.camera.cameraOffsetY * this.depthFactorY) + this.renderOffset.yPos,
    this.w + this.renderOffset.w,
    this.h + this.renderOffset.h);
    
    this.copyxPos = this.xPos + this.w;
    // for copy
    this.screenX = this.copyxPos + (this.game.camera.cameraOffsetX * (1 / this.depth *0.5));
    this.wrapX = this.copyxPos + ((this.screenX % this.wrapW) + this.wrapW) % this.wrapW;

    ctx.drawImage(
      this.img,
      this.wrapX - this.w -1 + this.renderOffset.xPos,
      0 + (game.camera.cameraOffsetY * this.depthFactorY) + this.renderOffset.yPos,
      this.w + this.renderOffset.w,
      this.h + this.renderOffset.h);
  }
}


class Background {
  constructor(game){
    this.game = game;
    
  }
  render(ctx){
    for(const layer of this.layers){
        layer.render(ctx);
    }
  }
}

class Animation{
  constructor(path,framesCount,animFrequency,looping, game){
    this.game = game;
    this.framesCount = framesCount;
    this.framesDuration = 1.0/animFrequency;
    this.frames = this.loadAnimationFromFolder(path,this.framesCount);
  }
  loadAnimationFromFolder(path, count) {
    return this.game.loader.loadImagesFromFolder(path, count)
  }
}

class AnimationPlayer {
  constructor(animation){
    this.animation = animation;
    this.isDone = false;
    this.animationTime = 0.0;
    this.currentFrame = 0;
  }
  
  getCurrentFrame(dt){
    this.animationTime += dt;
    if(this.animationTime >= this.animation.framesDuration){
      this.currentFrame = (++this.currentFrame % this.animation.framesCount);
      this.animationTime -= this.animation.framesDuration;
    }
    return this.animation.frames[this.currentFrame];
  }
  
  reset(){
    this.animationTime = 0.0;
    this.currentFrame = 0;
    this.isDone = false;
  }
}

class Camera extends Rect {
  constructor(x,y,w,h,entity,game){
    super(x,y,w,h);
    this.entity = entity;
    this.game = game;
    this.cameraOffsetX = 0;
    this.cameraOffsetY = 0;
    this.targetX = this.entity.xPos;
    this.targetY = this.entity.yPos;
    this.smoothness = 5;
  }
  update(dt){
    this.targetX = this.entity.xPos;
    this.targetY = this.entity.yPos;
    let dx = (this.targetX - this.xPos)* this.smoothness * dt;
    this.xPos += dx;
    let dy = (this.targetY - this.yPos)* this.smoothness * dt;
    this.yPos += dy;
    
    //this.xPos = this.entity.xPos;
    //this.yPos = this.entity.yPos;
    
    //calculating camera offset
    this.cameraOffsetX = (this.game.vCanvas.width / 8.0) - this.xPos;
    this.cameraOffsetY = (this.game.vCanvas.height / 2.0) - this.yPos;
  }
  render(ctx){
    //visually showing camera
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.centerX() + this.cameraOffsetX, this.centerY() + this.cameraOffsetY, this.w,this.h);
    ctx.strokeStyle = "black";
    ctx.strokeRect(this.centerX() + this.cameraOffsetX,this.centerY() + this.cameraOffsetY, this.w,this.h);
  }
}

class Player extends PhysicsRect {
  constructor(x,y,w,h, game){
    super(x,y,w,h);
    this.velocityX = 80.0;//80px per sec
    this.velocityY = 0.0;
    this.direction = 1;
    this.game = game;
    
    //Interpolated Position
    this.alphaX;
    this.alphaY;
    
    //Flags
    this.onAir = true;
    this.isJumping = false;
    this.isFalling = true;
    this.movingRight = false;
    this.jumpHandeled = false;
    
    //factors
    this.fallFactor = 2.0;
    this.gravityFactor = 1.0;
    
  }
  
  jump(){
    this.velocityY = -180;
    this.jumpHandeled = false;
  }
  
  update(dt){
    //flags Check
    if(this.velocityX > 0){
      this.movingRight = true;
    }
    if(this.velocityY > 0){
      this.isFalling = true;
    }
    if(this.velocityY < 0){
      this.isFalling = false;
    }
    
    this.fallFactor = Math.abs(this.velocityY)>70?2.0:1.0;
  //X direction handel
  this.xPos += this.velocityX *this.direction * dt;
  
  //Y direction handel
  if(this.game.inputs.jumpPressed && !this.jumpHandeled){
    this.jumpHandeled = true;
    this.jump();
  }
  
  //half dt handel
  let dy = this.velocityY * this.fallFactor* this.gravityFactor * dt/2.0;
  this.yPos += dy;
  //other half dt handel
  this.velocityY = Math.min(this.velocityY + (this.game.ACCLN_DUE_GRAVITY * this.fallFactor *this.gravityFactor*dt), this.game.BASE_TERMINAL_VELOCITY);
  
  dy = this.velocityY * dt/2.0;
  
  this.yPos += dy;
  }
  
  render(ctx){
    ctx.fillStyle = "black";
    ctx.fillRect(
      this.xPos + this.game.camera.cameraOffsetX,
      this.yPos,
      this.w,
      this.h);
  }
}

class GameInputs{
  jumpPressed = false;
  jumpReleased = false;
}
class Game {
  //Game constants
  SCREEN_WIDTH = 100;
  MAX_SCREEN_HEIGHT = 692;
  canvas;
  LOOP_FPS = 60;
  UPDATE_FPS = 60;
  UPDATE_STEP_DURATION = 1.0/this.UPDATE_FPS;
  LOOP_STEP_DURATION = 1.0/this.LOOP_FPS;
  ACCLN_DUE_GRAVITY = 150; // px per sec²
  BASE_TERMINAL_VELOCITY = 300; // px per sec
  
  //Game booleans
  isPortrait = false;
  isRunning = true;
  gamePaused = false;
  
  //Time dependencies
  updateAccumulator = 0.0;
  nowMs = performance.now();
  prevMs = this.nowMs;
  computedFrameDuration;
  
  //entities
  inputs;
  player;
  background;
  constructor(){
   this.canvas = document.getElementById("game");
    this.resize();
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    
    this.vCanvas = document.createElement("canvas");
    this.vCanvas.width = 1024;
    this.vCanvas.height = 346;
    this.vCtx = this.vCanvas.getContext("2d");
    this.vCtx.imageSmoothingEnabled = false;
    window.addEventListener("resize", () => this.resize());

    //Asset loadings
    this.init();
  }
  resize() {
    this.canvas.width = window.innerWidth - 10;
    this.canvas.height = Math.min(window.innerHeight -10, this.MAX_SCREEN_HEIGHT);
  }
  checkPortrait(){
    return window.innerWidth < window.innerHeight;
  }
  pauseScreenIfPortrait(){
      this.isPortrait = this.checkPortrait();
      if(this.isPortrait){
        this.gamePaused = true;
      }
  }
  async init(){
    await this.loadAll();
    this.background = new Background(this);
    this.background.layers = [
      new Layer(this.layer4,0,0, 4, this),
      new Layer(this.layer3,0,0, 3, this),
      new Layer(this.layer2,0,0, 2, this),
      new Layer(this.layer1,0,0, 1, this),
      new Layer(this.layer0,0,0, 0, this)
    ];
    this.background.layers[0].renderOffset.setOffsets(0,-30,0,30);
    this.inputs = new GameInputs();

    //Entity Creation
    this.player = new Player(100, 100, 30, 30, this);
    //camera object
    this.camera = new Camera(this.player.xPos,this.player.yPos,10,10,this.player,this);
    
    this.run();
  }
  run(){
    if(!this.isRunning) return;
    
      this.gamePaused = false;
      //this.pauseScreenIfPortrait();
      
      this.nowMs = performance.now();
      this.deltaTime = (this.nowMs - this.prevMs) / 1000; // second
      this.prevMs = this.nowMs;
      
      
      if(this.gamePaused){
        //update and render paused
        //Blur effect applied
        //Rotate screen message displayed
        
      }else{
        this.updateAccumulator += this.deltaTime;
        while(this.updateAccumulator >= this.UPDATE_STEP_DURATION){
          this.update(this.UPDATE_STEP_DURATION);
          this.updateAccumulator -= this.UPDATE_STEP_DURATION;
        }
        this.render(this.vCtx);
        
        this.computedFrameDuration = performance.now() -this.nowMs;
        if(this.computedFrameDuration < this.LOOP_STEP_DURATION){
          let sleepDuration = this.LOOP_STEP_DURATION - this.computedFrameDuration;
          //sleep fn
          //await sleep(sleepDuration);
        }
    }
    
    requestAnimationFrame(() => this.run());
  }
  
  async loadAll(){
    this.loader = new GameImage();
    this.layer4 = await this.loader.loadImage("./assets/background/4.png");
    this.layer3 = await this.loader.loadImage("./assets/background/3.png");
    this.layer2 = await this.loader.loadImage("./assets/background/2.png");
    this.layer1 = await this.loader.loadImage("./assets/background/1.png");
    this.layer0 = await this.loader.loadImage("./assets/background/0.png");
    
    //Animation Objects
    //Player Animations
   //this.playerIdle = new Animation("./assets/player/");
  }
  
  update(dt){
    this.player.update(dt);
    this.camera.update(dt);
  }
  
  render(ctx){
    //Clearing screen
    ctx.clearRect(0,0,this.vCanvas.width,this.vCanvas.height);
    
    this.background.render(ctx);
    
    ctx.fillRect(
      this.vCanvas.width / 2 - 2,
      this.vCanvas.height / 2 - 2,
      4, 4
    );
    
    //player render
    this.player.render(ctx);
    this.camera.render(ctx);
    
    //scaling the virtual ctx
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.ctx.drawImage(
      this.vCanvas,
      0,0,this.vCanvas.width,this.vCanvas.height,
      0,0,this.vCanvas.width*2,this.vCanvas.height*2
    );
  }
}
const game = new Game();
document.body.addEventListener("touchstart", () => {
      game.inputs.jumpPressed = true;
      game.inputs.jumpReleased = false;
      });
document.body.addEventListener("touchend", () => {
  game.inputs.jumpReleased = true;
  game.inputs.jumpPressed = false;
});

