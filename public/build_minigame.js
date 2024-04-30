function BuildTown(canvas){
    const ctx = canvas.getContext("2d")
    //нарисуем сетку
    let width = canvas.width
    let height = canvas.height
    let grid_rows = 8
    let grid_columns = 8
    let pole = [[]]
    let row = [[]]
    let bold = 1

    function FirstDrawGrid(){
        for (i=0;i<=grid_columns;i+=1){
            ctx.fillRect(width/grid_columns*i,0,bold,height)
            row[i]=0
        }
        for (i=0;i<=grid_rows;i+=1){
            ctx.fillRect(0,height/grid_rows*i,width+bold,bold)
            pole[i]=[]
            for (j in row){
                pole[i][j]=row[j]
            }
        }
    }
    
    function drawGrid(){
        for (i=0;i<=grid_columns;i+=1){
            ctx.fillRect(width/grid_columns*i,0,bold,height)
        }
        for (i=0;i<=grid_rows;i+=1){
            ctx.fillRect(0,height/grid_rows*i,width+bold,bold)
        }
    }
    
    function drawGridRect(x1,y1,x2,y2,text){
        for (i=x1;i<x2;i++){
            for(j=y1;j<y2;j++){
                pole[i][j]=text
            }
        }
    }
    
    FirstDrawGrid()
    drawGridRect(1,1,5,5,1)
    pole[1][1]=2
    function click(x,y){// функция производит необходимые действие при клике(касанию)
        if (y>grid_rows||x>grid_columns||pole[y][x]==0){
            return
        }
        player=find(2)
        pole[player.row][player.col]=1
        pole[y][x]=2
        draw()
        drawGrid()
    }
    canvas.onclick = function(e) { // обрабатываем клики мышью
        //Узнаем координаты
        var x = (e.pageX - canvas.offsetLeft) / (canvas.offsetWidth/grid_columns) | 0;//находит КЛЕТКУ!
        var y = (e.pageY - canvas.offsetTop)  / (canvas.offsetWidth/grid_rows) | 0;
        click(x, y); // выхов функции действия
    };
    
    function find(text){
        for (i in pole){
            for (j in pole[i]){
                if (pole[i][j] == text){
                    return {row:i,col:j}
                }
            }
        }
    }
    //Подгружаем картинки перед игрой
    let treeImg = new Image();
    let field1Img = new Image();
    let house1Img = new Image();
    treeImg.src = 'files/images/tree_min.png';
    ctx.drawImage(treeImg,height-5,width-3)
    field1Img.src = 'files/images/empty.png';
    ctx.drawImage(field1Img,height-5,width-2)
    house1Img.src = 'files/images/house.png';
    house1Img.onload =()=>{

        draw();
        drawGrid();
    }
    ctx.drawImage(house1Img,height-5,width-1)
    function draw(){
        i=0
        j=0
        while (j<grid_rows){
            while (i<grid_columns){
                // if (pole[j][i]==0){
                //     ctx.fillStyle = "#000"
                // }else if (pole[j][i]==1){
                //     ctx.fillStyle = "#fff"
                // }else if (pole[j][i]==2){
                //     ctx.fillStyle = "#999"
                // }
                let img = new Image();
                if (pole[j][i]==0){
                    ctx.drawImage(treeImg,i*(width/grid_columns),j*(height/grid_rows))
                }else if (pole[j][i]==1){
                    ctx.drawImage(field1Img,i*(width/grid_columns),j*(height/grid_rows))
                }else if (pole[j][i]==2){
                    ctx.drawImage(house1Img,i*(width/grid_columns),j*(height/grid_rows))
                }
                // ctx.fillRect(i*(width/grid_columns)+bold,j*(height/grid_rows)+bold,width/grid_columns,height/grid_rows)
                i+=1
            }
            i=0
            j+=1
        }
    }
    
}