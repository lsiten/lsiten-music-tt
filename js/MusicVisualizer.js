function Musicvisualizer(obj){
	this.source = null;
	this.count = 0;

	this.analyser = Musicvisualizer.ac.createAnalyser();
	this.size = obj.size;
	this.analyser.fftSize = this.size*2;

	// GainNode用来控制音频的音量
	this.gainNode = Musicvisualizer.ac[Musicvisualizer.ac.createGain?"createGain":"createGainNode"]();
	// 对象调用对象可以用obj.method，也可以obj[method]
	this.gainNode.connect(Musicvisualizer.ac.destination);

	this.analyser.connect(this.gainNode);
	this.analyserType = 0; // 0:不分声道，1:分声道
	// 创建声道分离处理器
	this.splitterNode = Musicvisualizer.ac.createChannelSplitter(2);
	this.mergerNode = Musicvisualizer.ac.createChannelMerger(2);
	this.analyserLeft =  Musicvisualizer.ac.createAnalyser();
	this.analyserRight =  Musicvisualizer.ac.createAnalyser();
	this.analyserLeft.fftSize = this.size * 2;
	this.analyserRight.fftSize = this.size * 2;
	this.splitterNode.connect(this.analyserLeft, 0);
	this.splitterNode.connect(this.analyserRight, 1);
	this.xhr = new XMLHttpRequest();
	this.draw = obj.draw;
	this.visualize();
}

Musicvisualizer.ac = new (window.AudioContext || window.webkitAudioContext)();//共用的

// 解决 Chrome 66之后高版本中AudioContext被强行suspend的问题
if(typeof AudioContext != "undefined" || typeof webkitAudioContext != "undefined") {
   var resumeAudio = function() {
      if(typeof Musicvisualizer.ac == "undefined" || Musicvisualizer.ac == null) return;
      if(Musicvisualizer.ac.state == "suspended") Musicvisualizer.ac.resume();
      document.removeEventListener("click", resumeAudio);
   };
   document.addEventListener("click", resumeAudio);
}

// load -> decode -> play
Musicvisualizer.prototype.load = function(url,fun){
	this.xhr.abort();
	this.xhr.open("GET",url);
	this.xhr.responseType = "arraybuffer";
	var self = this;
	this.xhr.onload = function(){
		fun(self.xhr.response);
	}
	this.xhr.send();
}

// BaseAudioContext.decodeAudioData()用来生成AudioBuffer
// AudioBuffer供AudioBufferSourceNode使用，这样，AudioBufferSourceNode才可以播放音频数据
Musicvisualizer.prototype.decode = function(arraybuffer,fun){
	Musicvisualizer.ac.decodeAudioData(arraybuffer,function(buffer){
		fun(buffer);
	},function(err){
		console.log(err);
	});
}

Musicvisualizer.prototype.play = function(path){
	var n = ++this.count;
	var self = this;
	self.source && self.source[self.source.stop ? "stop":"noteOff"](); // 开始前先暂停之前音频的播放，防止多份音频同时播放
	if(path instanceof ArrayBuffer){
		self.decode(path,function(buffer){
			if(n!=self.count) return;
			var bufferSource = Musicvisualizer.ac.createBufferSource();
			// 将解码成功后的buffer赋值给bufferSource的buffer属性
			bufferSource.buffer = buffer;
			bufferSource.loop = true;

			bufferSource.connect(self.splitterNode);
			// bufferSource.connect(self.analyser);
			self.analyserType = 1;
			bufferSource[bufferSource.start ? "start": "noteOn"](0);
			self.source = bufferSource;
		});
	}
	else{
		self.load(path,function(arraybuffer){
			if(n!=self.count) return;
			self.decode(arraybuffer,function(buffer){
				if(n!=self.count) return;
				var bufferSource = Musicvisualizer.ac.createBufferSource();
				// 将解码成功后的buffer赋值给bufferSource的buffer属性
				bufferSource.buffer = buffer;
				bufferSource.connect(self.splitterNode);
				// bufferSource.connect(self.analyser);
				self.analyserType = 1;
				bufferSource[bufferSource.start ? "start" : "noteOn"](0);
				self.source = bufferSource;
			});
		});
	}

}

Musicvisualizer.prototype.changeVolumn = function(percent){
	this.gainNode.gain.value = percent * percent;
}

Musicvisualizer.prototype.visualize = function () {
	var self = this;
	var arr = []
  self.analyserLeft.connect(self.mergerNode, 0, 0);
	self.analyserRight.connect(self.mergerNode, 0, 1);
	self.mergerNode.connect(self.analyser);
	requestAnimationFrame = window.requestAnimationFrame ||
							window.webkitrequestAnimationFrame ||
							window.mozrequestAnimationFrame;//兼容
	function fn(){
		arr = [];
		var leftFreqByteData = new Uint8Array(self.analyserLeft.frequencyBinCount);
		self.analyserLeft.getByteFrequencyData(leftFreqByteData);
		var rightFreqByteData = new Uint8Array(self.analyserRight.frequencyBinCount);
		self.analyserRight.getByteFrequencyData(rightFreqByteData);
		for (var i = 0; i < leftFreqByteData.length; i++) {
			arr.push(leftFreqByteData[i] * 0.3 + rightFreqByteData[i] * 0.7);
		}
		self.draw(arr);
		requestAnimationFrame(fn);
	}
	requestAnimationFrame(fn);
}
