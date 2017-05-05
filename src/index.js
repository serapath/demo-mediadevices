var bel = require('bel')
var csjs = require('csjs-inject')

var css = csjs`
  html { box-sizing: border-box; }
  *, *:before, *:after { box-sizing: inherit; }
  body { margin: 0; }
  .mediabox {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    padding: 50px;
    align-items: center;
  }
  .selector {
    display: block;
  }
  .processing {
    position: absolute;
    visibility: hidden;
  }
  .button {
    width: 100px;
  }
`

var width = 240 // width of incoming video
var height = 0 // will be computed from width and aspect ratio of stream
var streaming = false

var localMediaStream = null

var action = {
  play: playVideo,
  snap: takePicture,
  save: savePicture,
  start: start
}

var videoSelect = bel`<select class="${css.selector}"></select>`
var audioInputSelect = bel`<select class="${css.selector}"></select>`
var audioOutputSelect = bel`<select class="${css.selector}"></select>`
var video = bel`<video class="video" oncanplay=${action.play} controls>Video stream not available.</video>`
// var audio = element.querySelector('audio') // <audio>
var canvas = bel`<canvas></canvas>`
var photo = bel`<img alt="The screen capture will appear in this box.">`
var processing = bel`<canvas class="${css.processing}"></canvas>`

var element = bel`
  <div class="${css.mediabox}">
    <h1> works only on <code>https</code> or <code> localhost </code> </h1>
    ${videoSelect}
    ${audioInputSelect}
    ${audioOutputSelect}
    <div class="camera">
      <h1> Camera </h1>
      ${video}
      <button class="${css.button}" onclick=${action.start}>
        Start Camera
      </button>
    </div>
    <div class="canvas">
      <h1> Canvas </h1>
      ${canvas}
      ${processing}
      <button class="${css.button}" onclick=${action.snap}>
        Snap photo
      </button>
    </div>
    <div>
      <h1> Image </h1>
      ${photo}
      <button class="${css.button}" onclick=${action.save}>
        Save photo
      </button>
    </div>
  </div>
`

document.body.appendChild(element)

function playVideo (event) {
  if (!streaming) {
    video.setAttribute('width', width)
    video.setAttribute('height', height)
    canvas.setAttribute('width', width)
    canvas.setAttribute('height', height)
    streaming = true
  }
}

function takePicture (event) {
  event.preventDefault()
  snapshot(localMediaStream)
}

var filter = {
  crazy: function filter (ctx, photo) {
    ctx.filter = 'grayscale(0%) blur(3px) brightness(170%) contrast(128%) hue-rotate(230deg) opacity(100%) invert(30%) saturate(500%) sepia(24%)'
  },
  crazyAlternative: function alternativeFilter (ctx, /* ctx.getImageData */data) {
    data = data || ctx.getImageData(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight)
    for (var n = 0; n < data.width * data.height; n++) { // make all pixels grey
      // take the red, green and blue channels and reduce the data value by 255
      var index = n * 4
      data.data[index + 0] = 255 - data.data[index + 0]
      data.data[index + 1] = 255 - data.data[index + 1]
      data.data[index + 2] = 255 - data.data[index + 2]
    }
    return data
  },
  greyscale: function greyscaleFilter (ctx, /* rgba value array */data) {
    data = data || ctx.getImageData(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight)
    var r, g, b, brightness
    for (var i = 0, len = data.length; i < len; i += 4) {
      r = data[i]
      b = data[i + 1]
      g = data[i + 2]
      // alpha = data[i+3]
      brightness = (r + b + g) / 3
      data[i] = data[i + 1] = data[i + 2] = brightness
    }
    return data
  }
}

refreshDevices()

function refreshDevices () {
  if (!(navigator.mediaDevices || navigator.mediaDevices.enumerateDevices)) return

  while (videoSelect.firstChild) videoSelect.removeChild(videoSelect.firstChild)
  while (audioInputSelect.firstChild) audioInputSelect.removeChild(audioInputSelect.firstChild)
  while (audioOutputSelect.firstChild) audioOutputSelect.removeChild(audioOutputSelect.firstChild)

  // List cameras and microphones
  navigator.mediaDevices.enumerateDevices().then(function (devices) {
    devices.forEach(function (device) {
      console.log(device.kind + ': ' + device.label + ' (id = ' + device.deviceId + ')')
      // e.g.
      // videoinput: id = csO9c0YpAf274OuCPUA53CNE0YHlIr2yXCi+SqfBZZ8=
      // audioinput: id = RKxXByjnabbADGQNNZqLVLdmXlS0YkETYCIbg+XxnvM=
      // audioinput: id = r2/xw1xUPIyZunfV1lGrKOma5wTOvCkWfZ368XCndm0=
      // or if active or persistent permissions are granted:
      // videoinput: FaceTime HD Camera (Built-in) id=csO9c0YpAf274OuCPUA53CNE0YHlIr2yXCi+SqfBZZ8=
      // audioinput: default (Built-in Microphone) id=RKxXByjnabbADGQNNZqLVLdmXlS0YkETYCIbg+XxnvM=
      // audioinput: Built-in Microphone id=r2/xw1xUPIyZunfV1lGrKOma5wTOvCkWfZ368XCndm0=
      var option = document.createElement('option')
      option.value = device.deviceId
      if (device.kind === 'audioinput') {
        option.text = device.label || 'Microphone ' + (audioInputSelect.length + 1)
        audioInputSelect.appendChild(option)
      } else if (device.kind === 'audiooutput') {
        option.text = device.label || 'Speaker ' + (audioOutputSelect.length + 1)
        audioOutputSelect.appendChild(option)
      } else if (device.kind === 'videoinput') {
        option.text = device.label || 'Camera ' + (videoSelect.length + 1)
        videoSelect.appendChild(option)
      }
    })
  }).catch(handleError)
}

function snapshot (localMediaStream) {
  var ctx = processing.getContext('2d') // context
  if (width && height) {
    processing.width = width
    processing.height = height
    // canvas.width = video.clientWidth
    // canvas.height = video.clientHeight

    // The <canvas> API's ctx.drawImage(video, 0, 0) method
    // makes it trivial to draw <video> frames to <canvas>.
    ctx.drawImage(video, 0, 0, width, height)

    // var data = filter.crazy(ctx)
    var data = filter.crazyAlternative(ctx)
    ctx.putImageData(data, 0, 0)

    // "image/webp" works in Chrome.
    // Other browsers will fall back to image/png.
    var dataURL = processing.toDataURL('image/webp', 0.95)
    if (dataURL && dataURL !== 'data:,') photo.setAttribute('src', dataURL)
    else console.error('Image not available')
  } else clearphoto()
}

function clearphoto () {
  var ctx = canvas.getContext('2d') // context
  ctx.fillStyle = '#AAA'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  var data = canvas.toDataURL('image/png')
  photo.setAttribute('src', data)
}

function savePicture (event) {
  var fileName = generateImageName()
  fileName = fileName + '.txt'
  var dataURL = photo.getAttribute('src')
  console.log('DOWNLOAD', fileName, dataURL)
  // ... save/upload logic here ...
}

function generateImageName () {
  // ... generate image name logic here ...
  return 'imageName' + Math.floor(Math.random())
}

function start () {
  stopVideo()
  clearphoto()
  // var audioSource = audioInputSelect.value
  var videoSource = videoSelect.value
  // var constraints = { video: true, audio: false }
  // var constraints = { video: { facingMode: 'user' } }
  //   var constraints = {
  //     audio: { optional: [{sourceId: device.deviceId}] },
  //     video: { optional: [{sourceId: device.deviceId}] }
  //   }
  // var constraints = { audio: true, video: { width: 1280, height: 720 } }
  // var constraints = { video: { frameRate: { ideal: 10, max: 15 } } }
  // var constraints = { video: { facingMode: (front? "user" : "environment") } }
  // var constraints = {
  //   video: {
  //     // constraints: https://w3c.github.io/mediacapture-main/getusermedia.html#idl-def-MediaTrackConstraints
  //     mandatory: { // hdConstraints
  //       minWidth: 1280,
  //       minHeight: 720
  //     }
  //     // mandatory: { // vgaConstraints
  //     //   maxWidth: 640,
  //     //   maxHeight: 360
  //     // }
  //   },
  //   audio: true
  //   /*...*/
  // }
  var constraints = {
    // audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    video: { deviceId: videoSource ? { exact: videoSource } : undefined }
  }
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(constraints)
      .then(gotStream)
      .catch(handleError)
  } else {
    video.src = 'fallback.webm'
  }
}

function stopVideo () {
  if (localMediaStream) {
    localMediaStream.getTracks().forEach(function (track) { track.stop() })
    localMediaStream = null
  }
}

function gotStream (stream) {
  // Instead of feeding the video a URL to a media file, we're feeding it a
  // Blob URL obtained from a LocalMediaStream object representing the webcam
  // https://www.html5rocks.com/en/tutorials/workers/basics/#toc-inlineworkers-bloburis
  // video.src = window.URL.createObjectURL(localMediaStream)
  localMediaStream = stream
  video.srcObject = stream

  // Adding controls also works as you'd expected
  // video.play()
  // vs.
  video.onloadedmetadata = function (e) { // to unfreeze
    width = video.videoWidth
    height = video.videoHeight / (video.videoWidth / width)
    video.play() // or <video autoplay></video>
  }

  video.onplay = function () {
    var context = canvas.getContext('2d')
    draw(video, context, 400, 300)
  }
}

function draw (video, context) {
  context.drawImage(video, 0, 0, width, height)
  var image = context.getImageData(0, 0, width, height)
  // image.data = filter.crazy(image.data)
  // image.data = filter.crazyAlternative(image.data)
  image.data = filter.greyscale(null, image.data)
  context.putImageData(image, 0, 0)
  setTimeout(function () { draw(video, context) }, 16) // for 60 fps
}

// function video2canvas (video, canvas) {
//   var vid = video || document.createElement('video')
//   return image2canvas(vid, canvas)
// }
// function image2canvas (image, canvas) {
//   var can = canvas || document.createElement('canvas')
//   can.width = image.width
//   can.height = image.height
//   var context = can.getContext('2d')
//   context.drawImage(image, 0, 0/*, image.width, image.height */)
//   return can
// }
//
// function canvas2image (canvas, image, format) {
//   var img = image || new Image() // a little bit faster than document.createElement
//   img.src = canvas.toDataURL(format || 'image/png')
//   return img
// }

function handleError (error) {
  if (error) console.error(error.name + ': ' + error.message)
  console.error('navigator.getUserMedia error: ', error)
}
// /////////////////////////
// RECORD
// ////////////////////////
// var media = {
//   video: {
//     tag: 'video',
//     type: 'video/webm',
//     ext: '.mp4'
//   },
//   audio: {
//     tag: 'audio',
//     type: 'audio/ogg',
//     ext: '.ogg'
//   }
// }
// var recorder = new MediaRecorder(stream)
// recorder.ondataavailable = function (event) {
//   chunks.push(event.data)
//   if(recorder.state == 'inactive')  makeLink()
// }
// recorder.start()
// // https://github.com/Mido22/MediaRecorder-sample/blob/master/script.js
// setTimeout(function () {
//   recorder.stop()
// }, 5000)
// function makeLink(){
//   var blob = new Blob(chunks, {type: media.type })
//   var url = URL.createObjectURL(blob)
//   var li = document.createElement('li')
//   var mt = document.createElement(media.tag)
//   var hf = document.createElement('a')
//   mt.controls = true
//   mt.src = url
//   hf.href = url
//   hf.download = `${counter++}${media.ext}`
//   hf.innerHTML = `donwload ${hf.download}`
//   li.appendChild(mt)
//   li.appendChild(hf)
//   ul.appendChild(li)
// }
// function makeLink() {
// chunks = [];
// recorder = new MediaRecorder(stream);
// recorder.ondataavailable = e => {
//   chunks.push(e.data);
//   if (recorder.state == 'inactive') makeLink();
// };
// recorder.stop();
//
//   let blob = new Blob(chunks, {
//       type: media.type
//     }),
//     url = URL.createObjectURL(blob),
//
//     mt = document.createElement(media.tag),
//     hf = document.createElement('a');
//
//   mt.controls = true;
//   mt.src = url;
//
//   hf.href = url;
//   hf.download = `${counter++}${media.ext}`;
//   hf.innerHTML = `donwload ${hf.download}`;
// }
