class FightMiniGame{
    constructor(canvas){
        this.canvas = canvas
        this.ctx = this.canvas.getContext("2d");
    }
    clear(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    spawn(name){
        if (name = "forest"){
            this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
            this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        }
    }
    init(params) {
        ctx=canvas.getContext("2d");
        mouse = {
            x:0,
            y:0
        }
        //---------------------------------------------
        //ивенты -- в основном для пушки
        document.oncontextmenu = cmenu; function cmenu() { return false; } //чтобы нельзя было пкм
        //просто для позиции мыши
        canvas.addEventListener(`mousemove`, setPos);
        function setPos({layerX, layerY}) {
            [mouse.x, mouse.y] = [layerX, layerY];
        }
        function getRandomInt(max) {
            return Math.floor(Math.random() * max);
        }
        
        canvas.onclick = function Click(){
            fire();
        }
        
        function fire(){
            if (phxON){
                let DX= mouse.x-gun.x;
                    DY= mouse.y-gun.y;
                    HYP = Math.sqrt(DX*DX+DY*DY)
                    direction = Math.asin(DY/HYP)
                bullets[bullets.length]=new bullet(gun.x,gun.y,Math.cos(direction)*gun.db,Math.sin(direction)*gun.db,gun.size,)
                gun.power-=3;//обнуляем повер
                if (gun.power<0){
                    gun.power=0;
                }
            }
        }

        //-------------------------------------------

        class bullet{
            constructor(x,y,dx,dy,size,img,type){
                this.x=x||10;
                this.y=y||10;
                this.dx=dx||5;
                this.dy=dy||5;
                this.size=size+1+gun.power/20||2+gun.power/20;
                this.hp=1;
                this.color="rgb("+(gun.power)+",60,60)"
                this.kill=false;
                this.img=new Image();
                this.img.src=img||"img/none.png"
                this.type=type||""
            }
        }

        class block{
            constructor(x,y,height,width,hp,dx,dy,img,type,type2){
                this.x=x||10;
                this.y=y||10;
                this.dx=dx||0;
                this.dy=dy||0;
                this.hp=hp||10;
                this.width=width||200;
                this.height=height||200;
                this.color="rgba("+this.hp+","+this.hp*5+","+this.hp*10+",0.2)"
                this.kill=false;
                this.img=new Image();
                this.img.src=img||"df.png"
                this.type=type||"mob"
                this.type2=type2||""
            }
        }
        //--------------------------------------------
        
        function deal_damage(object,dmg){
            object.hp-=dmg;
            object.color="rgba("+object.hp/10+","+object.hp+","+object.hp*10+","+0.002*object.hp+")"
            if (object.hp<=0){
                object.kill=true;
                if (object.type=="key"){
                    lock()
                }
            }
        }
        //* DELTA TIME --------------------
        deltaTime=0; // Чисто в теории нормализирует время игры и исключает влияние железа
        function animate(now){
            deltaTime = now - lastTime
            lastTime = now
            requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
        //* --------------------------------
        function bullet_gravity(bullet){
            if (!bullet.kill)
            {
                //? физика
                bullet.x+=bullet.dx * deltaTime/20
                bullet.y+=bullet.dy * deltaTime/20
                bullet.dx*=0.999;
                bullet.dy+=0.01;
        
                //? Отрисовка
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, bullet.size, 0, 2*Math.PI, false);
                ctx.fillStyle = bullet.color
                ctx.fill();
                ctx.drawImage(bullet.img,bullet.x-bullet.size,bullet.y-bullet.size,bullet.size*2,bullet.size*2);
                
            }
        }
        /////////рисуем объекты
        function objgrav(object){
            if (!object.kill){
                object.x+=object.dx*deltaTime/20;
                object.y+=object.dy*deltaTime/20;
                object.color = "rgba("+object.hp/10+","+object.hp+","+object.hp*10+","+0.002*object.hp+")"
                ctx.fillStyle = object.color
                ctx.fillRect(object.x,object.y,object.width,object.height);
                ctx.drawImage(object.img,object.x,object.y,object.width,object.height);
                if (object.y+object.height>canvas.height&&object.dy>0){
                    object.dy*=-1;
                    if (object.type2=="jump"){
                        object.dx*=-1;
                    }
                }
                if(object.x<0){
                    location = location
                    alert("Ты проиграл, перезагрузи страницу")
                    window.location.reload()
                    
                }
            }
        }
        function touch(obj1,obj2){
            if ((obj1.x+obj1.size/*ширина пульки*/>obj2.x)&&(obj1.x-obj2.height<obj2.x))//по x (obj1.x>obj2.x)
            {
                if ((obj1.y+obj1.size/*высота пульки*/>obj2.y)&&(obj1.y-obj2.height<obj2.y))//по y +obj2.height
                {
                    obj1.kill=true;
                    deal_damage(obj2,gun.dmg+obj1.size/2)
                }
            }
        }
        function physics(){
            if(phxON){
                ctx.fillStyle="rgba(20,260,20,"+gun.compas+")"
                    ctx.font="20px Impact"
                    ctx.fillText("Энергия:"+Math.round(gun.power)+"\n Урон:"+Math.round(gun.dmg), 10, 20);
                if (gun.power<200){
                    gun.power+=gun.Count
                }
                ctx.fillStyle = 'rgba(30,30,30,0.4)'
                ctx.fillRect(0,0,canvas.width,canvas.height);
                
                //рисуем пули
                for (j=0;j<bullets.length;j+=1){
                    if (bullets[j].y>1000){
                        bullets[j].kill=true
                    }
                    bullet_gravity(bullets[j]);
                }
                for(j=0;j<objects.length;j++){
                    if (!objects[j].kill){
                    objgrav(objects[j])
                        for(k=0;k<bullets.length;k+=1){
                            if (!bullets[k].kill){
                                touch(bullets[k],objects[j])
                            }
                        }
                    }
                }
                setTimeout(physics,10)
            }
        }
        function draw(x , y, hp, dx, dy, height,width,src,type,type2){
            objects[objects.length]=new block (x*10,y*10,height,width, hp, dx,dy,src,type,type2)
        }
    }
}