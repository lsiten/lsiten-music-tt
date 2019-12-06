var size = 128;
var PI = Math.PI;
var initTime = parseInt((new Date()).getTime());
var colorIndex = 0;
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
var box = this.document.querySelector('#box');
var height = window.height;
var width = window.width;
var line;

var color = [
  {
    color: getRandomColor(),
    expire: initTime
  },
  {
    color: getRandomColor(),
    expire: initTime
  }
];
var music = new Musicvisualizer({
  size: size,
  draw: function (arr) {
    var now = parseInt((new Date()).getTime());
    var arrTemp = getSomeDots(arr);
    var DeltT = (now - initTime) / 1000;
    DeltT = DeltT % 60;
    ctx.clearRect(0,0,width,height);
    ctx.beginPath();
    ctx.fillStyle = "#FFDEC9";
    ctx.lineWidth = 2;
    ctx.rect(0,0,width,height);
    ctx.fill();
    ctx.closePath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = color[0].expire && (color[0].expire + 1000 > now) ? color[0].color : (color[0].color = getRandomColor(), color[0].expire = now, color[0].color);
    drawCircle(ctx, arrTemp, 80, DeltT);
    ctx.strokeStyle = color[1].expire && (color[1].expire + 1000 > now) ? color[1].color : (color[1].color = getRandomColor(), color[1].expire = now, color[1].color);
    drawCircle(ctx, arrTemp, 90, DeltT);
    drawCircleDots(ctx, arrTemp, 70, DeltT);
  }
})

function getRandom(m,n){
	return Math.round(Math.random()*(n-m)+m);
}
var getSomeDots = function (arr) {
  var dotSize = 10;
  var dots = [];
  for (var i = 0; i < arr.length; i += 2) {
    dots.push(arr[i])
  }
  var index2 = getRandom(dotSize, dotSize * 2);
  var index3 = getRandom(index2 + dotSize, index2 + dotSize * 2);
  var dots1 = dots.slice(0, dotSize);
  var dots2 = dots.slice(index2, index2 + dotSize);
  var dots3 = dots.slice(index3, index3 + dotSize);
  return dots2.concat(dots1, dots3);
}

var drawCircleDots = function (context, data, R, DeltT) {
  var length = data.length;
  var origin = [width / 2, height / 2];
  for (var i = 0; i < length; i++) {
    var theta = i / length * 2 * PI + DeltT * PI / 30;
    context.beginPath();
    ctx.fillStyle = "#000000";
    context.arc(origin[0] + R * Math.cos(theta), origin[1] + R * Math.sin(theta), 2, 0, 2*Math.PI);
    context.fill();
    context.closePath();
  }
}

var drawCircle = function (context, data, R, DeltT) {
  var length = data.length;
  context.beginPath();
  for (var i = 0; i < length; i++) {
    drawCircleByI(i, length, data, context, R, DeltT);
  }
  drawCircleByI(0, length, data, context, R, DeltT);
  context.stroke();
  context.closePath();
}

var drawCircleByI = function (i, length, data, context, R, DeltT) {
  var origin = [width / 2, height / 2];
  var theta = i / length * 2 * PI + DeltT * PI / 30;
  var alpha = data[i] / 256 * R * 0.6;
  alpha < 1 && (alpha = 0);
  // alpha > 10 && (alpha = 10);
  i % 5 > 0 ? alpha = alpha / (i % 10) : alpha = 0;
  i % 3 > 0 && (alpha = 0);
  var x = origin[0] + R * Math.cos(theta) + alpha * Math.cos(theta);
  var y = origin[1] + R * Math.sin(theta) + alpha * Math.sin(theta);
  y < 10 && (y = y - alpha * Math.sin(theta));
  y > height -10 && (y = y - alpha * Math.sin(theta));
  context.lineTo(x, y);
}
function getRandom(m, n) {
	return Math.round(Math.random() * (n - m) + m);
}

function getRandomColor() {
  var colors = [
    '#3B200C'
  ]
  colorIndex = colorIndex === 0 ? Math.floor(Math.random() *  colors.length) : colorIndex++;
  colorIndex >= colors.length && (colorIndex = 0);
	return colors[colorIndex];
}


function resize(){
	height = box.clientHeight;
	width = box.clientWidth;
	canvas.width = width;
	canvas.height = height;

	// 设置渐变色
	line = ctx.createLinearGradient(0, 0, 0, height);//线性渐变
	line.addColorStop(0,"red");
	line.addColorStop(0.5,"orange");
	line.addColorStop(1,"green");
}
window.onresize = resize;
window.onload = function () {
  var file = document.querySelector('#loadfile');
  var addButton = this.document.querySelector('#add');
  box.appendChild(canvas);
  resize();
  music.changeVolumn(0.6);//初始化音频大小
  addButton.addEventListener('click', function () {
    file.click();
  })

  file.addEventListener('change', function () {
    var fr = new FileReader();
    fr.onload = function(e){
      // 重写play方法  这边e.target.result已经是arraybuffer对象类型，不再是ajax路径读入
      music.play(e.target.result);
    }
    fr.readAsArrayBuffer(this.files[0]);
  })
}