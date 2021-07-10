const got = require("got");
const braces = require("braces");

function serverURL(pathname = "/") {
  return `http://localhost:5000${pathname}`;
}

function url_test(from, to, { statusCode = 301 } = {}) {
  const expanded = braces.expand(from);

  return expanded.map((f) => [
    f,
    async () => {
      const res = await got(serverURL(f), {
        followRedirect: false,
        throwHttpErrors: false,
      });
      console.log(serverURL(f), res.statusCode);
      expect(res.statusCode).toBe(statusCode);
      if (to) {
        expect((res.headers.location || "").toLowerCase()).toBe(
          encodeURI(to).toLowerCase()
        );
      }
    },
  ]);
}

const SCL3_REDIRECT_URLS = [].concat(
  url_test("/media/redesign/css/foo-min.css", "/static/build/styles/foo.css"),
  url_test("/media/css/foo-min.css", "/static/build/styles/foo.css"),
  url_test("/media/redesign/js/foo-min.js", "/static/build/js/foo.js"),
  url_test("/media/js/foo-min.js", "/static/build/js/foo.js"),
  url_test("/media/redesign/img.foo", "/static/img.foo"),
  url_test("/media/img.foo", "/static/img.foo"),
  url_test("/media/redesign/css.foo", "/static/styles.foo"),
  url_test("/media/css.foo", "/static/styles.foo"),
  url_test("/media/redesign/js.foo", "/static/js.foo"),
  url_test("/media/js.foo", "/static/js.foo"),
  url_test("/media/redesign/fonts.foo", "/static/fonts.foo"),
  url_test("/media/fonts.foo", "/static/fonts.foo"),
  url_test(
    "/media/uploads/demos/foobar123",
    "/docs/Web/Demos_of_open_web_technologies/",
    { statusCode: 302 }
  ),
  url_test(
    "/docs/Mozilla/Projects/NSPR/Reference/I//O_Functions",
    "/docs/Mozilla/Projects/NSPR/Reference/I_O_Functions"
  ),
  url_test(
    "/docs/Mozilla/Projects/NSPR/Reference/I//O//Functions",
    "/docs/Mozilla/Projects/NSPR/Reference/I_O_Functions"
  ),
  url_test(
    "/samples/canvas-tutorial/2_1_canvas_rect.html",
    "/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes#Rectangular_shape_example"
  ),
  url_test(
    "/samples/canvas-tutorial/2_2_canvas_moveto.html",
    "/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes#Moving_the_pen"
  ),
  url_test(
    "/samples/canvas-tutorial/2_3_canvas_lineto.html",
    "/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes#Lines"
  ),
  url_test(
    "/samples/canvas-tutorial/2_4_canvas_arc.html",
    "/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes#Arcs"
  ),
  url_test(
    "/samples/canvas-tutorial/2_5_canvas_quadraticcurveto.html",
    "/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes#Quadratic_Bezier_curves"
  ),
  url_test(
    "/samples/canvas-tutorial/2_6_canvas_beziercurveto.html",
    "/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes#Cubic_Bezier_curves"
  ),
  url_test(
    "/samples/canvas-tutorial/3_1_canvas_drawimage.html",
    "/docs/Web/API/Canvas_API/Tutorial/Using_images#Drawing_images"
  ),
  url_test(
    "/samples/canvas-tutorial/3_2_canvas_drawimage.html",
    "/docs/Web/API/Canvas_API/Tutorial/Using_images#Example.3A_Tiling_an_image"
  ),
  url_test(
    "/samples/canvas-tutorial/3_3_canvas_drawimage.html",
    "/docs/Web/API/Canvas_API/Tutorial/Using_images#Example.3A_Framing_an_image"
  ),
  url_test(
    "/samples/canvas-tutorial/3_4_canvas_gallery.html",
    "/docs/Web/API/Canvas_API/Tutorial/Using_images#Art_gallery_example"
  ),
  url_test(
    "/samples/canvas-tutorial/4_1_canvas_fillstyle.html",
    "/docs/Web/API/CanvasRenderingContext2D.fillStyle"
  ),
  url_test(
    "/samples/canvas-tutorial/4_2_canvas_strokestyle.html",
    "/docs/Web/API/CanvasRenderingContext2D.strokeStyle"
  ),
  url_test(
    "/samples/canvas-tutorial/4_3_canvas_globalalpha.html",
    "/docs/Web/API/CanvasRenderingContext2D.globalAlpha"
  ),
  url_test(
    "/samples/canvas-tutorial/4_4_canvas_rgba.html",
    "/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors#An_example_using_rgba()"
  ),
  url_test(
    "/samples/canvas-tutorial/4_5_canvas_linewidth.html",
    "/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors#A_lineWidth_example"
  ),
  url_test(
    "/samples/canvas-tutorial/4_6_canvas_linecap.html",
    "/docs/Web/API/CanvasRenderingContext2D.lineCap"
  ),
  url_test(
    "/samples/canvas-tutorial/4_7_canvas_linejoin.html",
    "/docs/Web/API/CanvasRenderingContext2D.lineJoin"
  ),
  url_test(
    "/samples/canvas-tutorial/4_8_canvas_miterlimit.html",
    "/docs/Web/API/CanvasRenderingContext2D.miterLimit"
  ),
  url_test(
    "/samples/canvas-tutorial/4_9_canvas_lineargradient.html",
    "/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors#A_createLinearGradient_example"
  ),
  url_test(
    "/samples/canvas-tutorial/4_10_canvas_radialgradient.html",
    "/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors#A_createRadialGradient_example"
  ),
  url_test(
    "/samples/canvas-tutorial/4_11_canvas_createpattern.html",
    "/docs/Web/API/CanvasRenderingContext2D.createPattern"
  ),
  url_test(
    "/samples/canvas-tutorial/5_1_canvas_savestate.html",
    "/docs/Web/API/Canvas_API/Tutorial/Transformations#A_save_and_restore_canvas_state_example"
  ),
  url_test(
    "/samples/canvas-tutorial/5_2_canvas_translate.html",
    "/docs/Web/API/CanvasRenderingContext2D.translate"
  ),
  url_test(
    "/samples/canvas-tutorial/5_3_canvas_rotate.html",
    "/docs/Web/API/CanvasRenderingContext2D.rotate"
  ),
  url_test(
    "/samples/canvas-tutorial/5_4_canvas_scale.html",
    "/docs/Web/API/CanvasRenderingContext2D.scale"
  ),
  url_test(
    "/samples/canvas-tutorial/6_1_canvas_composite.html",
    "/docs/Web/API/CanvasRenderingContext2D.globalCompositeOperation"
  ),
  url_test(
    "/samples/canvas-tutorial/6_2_canvas_clipping.html",
    "/docs/Web/API/Canvas_API/Tutorial/Compositing#Clipping_paths"
  ),
  url_test(
    "/samples/canvas-tutorial/globalCompositeOperation.html",
    "/docs/Web/API/CanvasRenderingContext2D.globalCompositeOperation"
  ),
  url_test(
    "/samples/domref/mozGetAsFile.html",
    "/docs/Web/API/HTMLCanvasElement.mozGetAsFile"
  ),
  url_test("/Firefox_OS/Security", "/docs/Mozilla/Firefox_OS/Security"),
  url_test("/en-US/mobile", "/en-US/docs/Mozilla/Mobile"),
  url_test("/en-US/mobile/", "/en-US/docs/Mozilla/Mobile"),
  url_test("/en/mobile/", "/en/docs/Mozilla/Mobile"),
  url_test("/en-US/addons", "/en-US/Add-ons"),
  url_test("/en-US/addons/", "/en-US/Add-ons"),
  url_test("/en/addons/", "/en/Add-ons"),
  url_test("/en-US/mozilla", "/en-US/docs/Mozilla"),
  url_test("/en-US/mozilla/", "/en-US/docs/Mozilla"),
  url_test("/en/mozilla/", "/en/docs/Mozilla"),
  url_test("/en-US/web", "/en-US/docs/Web"),
  url_test("/en-US/web/", "/en-US/docs/Web"),
  url_test("/en/web/", "/en/docs/Web"),
  url_test("/en-US/learn/html5", "/en-US/docs/Web/Guide/HTML/HTML5"),
  url_test("/en-US/learn/html5/", "/en-US/docs/Web/Guide/HTML/HTML5"),
  url_test("/en/learn/html5/", "/en/docs/Web/Guide/HTML/HTML5"),
  url_test(
    "/En/JavaScript/Reference/Objects/Array",
    "/en-US/docs/JavaScript/Reference/Global_Objects/Array"
  ),
  url_test(
    "/En/JavaScript/Reference/Objects",
    "/en-US/docs/JavaScript/Reference/Global_Objects/Object"
  ),
  url_test(
    "/En/Core_JavaScript_1.5_Reference/Objects/foo",
    "/en-US/docs/JavaScript/Reference/Global_Objects/foo"
  ),
  url_test(
    "/En/Core_JavaScript_1.5_Reference/foo",
    "/en-US/docs/JavaScript/Reference/foo"
  ),
  url_test("/en-US/HTML5", "/en-US/docs/HTML/HTML5"),
  url_test("/es/HTML5", "/es/docs/HTML/HTML5"),
  url_test(
    "/web-tech/2008/09/12/css-transforms",
    "/docs/CSS/Using_CSS_transforms"
  ),
  url_test("/en-US/docs", "/en-US/docs/Web"),
  url_test("/es/docs/", "/es/docs/Web"),
  url_test(
    "/en-US/devnews/index.php/feed.foo",
    "https://blog.mozilla.org/feed/"
  ),
  url_test("/en-US/devnews/foo", "https://wiki.mozilla.org/Releases"),
  // Learn is prefixed with /docs which differs from kuma
  url_test("/en-US/learn/html", "/en-US/docs/Learn/HTML"),
  url_test("/en/learn/html", "/en/docs/Learn/HTML"),
  url_test("/en-US/learn/css", "/en-US/docs/Learn/CSS"),
  url_test("/en/learn/css", "/en/docs/Learn/CSS"),
  url_test("/en-US/learn/javascript", "/en-US/docs/Learn/JavaScript"),
  url_test(
    "/en-US/Learn/JavaScript/First_steps",
    "/en-US/docs/Learn/JavaScript/First_steps"
  ),
  url_test("/en/learn/javascript", "/en/docs/Learn/JavaScript"),
  url_test("/en-US/learn", "/en-US/docs/Learn"),
  url_test("/en/learn", "/en/docs/Learn"),
  url_test(
    "/en-US/demos/detail/bananabread",
    "https://github.com/kripken/BananaBread/"
  ),
  url_test(
    "/en/demos/detail/bananabread",
    "https://github.com/kripken/BananaBread/"
  ),
  url_test(
    "/en-US/demos/detail/bananabread/launch",
    "https://kripken.github.io/BananaBread/cube2/index.html"
  ),
  url_test(
    "/en/demos/detail/bananabread/launch",
    "https://kripken.github.io/BananaBread/cube2/index.html"
  ),
  url_test("/en-US/demos", "/en-US/docs/Web/Demos_of_open_web_technologies"),
  url_test("/en/demos", "/en/docs/Web/Demos_of_open_web_technologies")
);

const GITHUB_IO_URLS = [].concat(
  url_test(
    "/samples/raycaster/input.js",
    "http://mdn.github.io/canvas-raycaster/input.js"
  ),
  url_test(
    "/samples/raycaster/Level.js",
    "http://mdn.github.io/canvas-raycaster/Level.js"
  ),
  url_test(
    "/samples/raycaster/Player.js",
    "http://mdn.github.io/canvas-raycaster/Player.js"
  ),
  url_test(
    "/samples/raycaster/RayCaster.html",
    "http://mdn.github.io/canvas-raycaster/index.html"
  ),
  url_test(
    "/samples/raycaster/RayCaster.js",
    "http://mdn.github.io/canvas-raycaster/RayCaster.js"
  ),
  url_test(
    "/samples/raycaster/trace.css",
    "http://mdn.github.io/canvas-raycaster/trace.css"
  ),
  url_test(
    "/samples/raycaster/trace.js",
    "http://mdn.github.io/canvas-raycaster/trace.js"
  ),
  url_test(
    "/samples/webgl/sample1",
    "http://mdn.github.io/webgl-examples/tutorial/sample1"
  ),
  url_test(
    "/samples/webgl/sample1/index.html",
    "http://mdn.github.io/webgl-examples/tutorial/sample1/index.html"
  ),
  url_test(
    "/samples/webgl/sample1/webgl-demo.js",
    "http://mdn.github.io/webgl-examples/tutorial/sample1/webgl-demo.js"
  ),
  url_test(
    "/samples/webgl/sample1/webgl.css",
    "http://mdn.github.io/webgl-examples/tutorial/webgl.css"
  ),
  url_test(
    "/samples/webgl/sample2",
    "http://mdn.github.io/webgl-examples/tutorial/sample2"
  ),
  url_test(
    "/samples/webgl/sample2/glUtils.js",
    "http://mdn.github.io/webgl-examples/tutorial/glUtils.js"
  ),
  url_test(
    "/samples/webgl/sample2/index.html",
    "http://mdn.github.io/webgl-examples/tutorial/sample2/index.html"
  ),
  url_test(
    "/samples/webgl/sample2/sylvester.js",
    "http://mdn.github.io/webgl-examples/tutorial/sylvester.js"
  ),
  url_test(
    "/samples/webgl/sample2/webgl-demo.js",
    "http://mdn.github.io/webgl-examples/tutorial/sample2/webgl-demo.js"
  ),
  url_test(
    "/samples/webgl/sample2/webgl.css",
    "http://mdn.github.io/webgl-examples/tutorial/webgl.css"
  ),
  url_test(
    "/samples/webgl/sample3",
    "http://mdn.github.io/webgl-examples/tutorial/sample3"
  ),
  url_test(
    "/samples/webgl/sample3/glUtils.js",
    "http://mdn.github.io/webgl-examples/tutorial/glUtils.js"
  ),
  url_test(
    "/samples/webgl/sample3/index.html",
    "http://mdn.github.io/webgl-examples/tutorial/sample3/index.html"
  ),
  url_test(
    "/samples/webgl/sample3/sylvester.js",
    "http://mdn.github.io/webgl-examples/tutorial/sylvester.js"
  ),
  url_test(
    "/samples/webgl/sample3/webgl-demo.js",
    "http://mdn.github.io/webgl-examples/tutorial/sample3/webgl-demo.js"
  ),
  url_test(
    "/samples/webgl/sample3/webgl.css",
    "http://mdn.github.io/webgl-examples/tutorial/webgl.css"
  ),
  url_test(
    "/samples/webgl/sample4",
    "http://mdn.github.io/webgl-examples/tutorial/sample4"
  ),
  url_test(
    "/samples/webgl/sample4/glUtils.js",
    "http://mdn.github.io/webgl-examples/tutorial/glUtils.js"
  ),
  url_test(
    "/samples/webgl/sample4/index.html",
    "http://mdn.github.io/webgl-examples/tutorial/sample4/index.html"
  ),
  url_test(
    "/samples/webgl/sample4/sylvester.js",
    "http://mdn.github.io/webgl-examples/tutorial/sylvester.js"
  ),
  url_test(
    "/samples/webgl/sample4/webgl-demo.js",
    "http://mdn.github.io/webgl-examples/tutorial/sample4/webgl-demo.js"
  ),
  url_test(
    "/samples/webgl/sample4/webgl.css",
    "http://mdn.github.io/webgl-examples/tutorial/webgl.css"
  ),
  url_test(
    "/samples/webgl/sample5",
    "http://mdn.github.io/webgl-examples/tutorial/sample5"
  ),
  url_test(
    "/samples/webgl/sample5/glUtils.js",
    "http://mdn.github.io/webgl-examples/tutorial/glUtils.js"
  ),
  url_test(
    "/samples/webgl/sample5/index.html",
    "http://mdn.github.io/webgl-examples/tutorial/sample5/index.html"
  ),
  url_test(
    "/samples/webgl/sample5/sylvester.js",
    "http://mdn.github.io/webgl-examples/tutorial/sylvester.js"
  ),
  url_test(
    "/samples/webgl/sample5/webgl-demo.js",
    "http://mdn.github.io/webgl-examples/tutorial/sample5/webgl-demo.js"
  ),
  url_test(
    "/samples/webgl/sample5/webgl.css",
    "http://mdn.github.io/webgl-examples/tutorial/webgl.css"
  ),
  url_test(
    "/samples/webgl/sample6",
    "http://mdn.github.io/webgl-examples/tutorial/sample6"
  ),
  url_test(
    "/samples/webgl/sample6/cubetexture.png",
    "http://mdn.github.io/webgl-examples/tutorial/sample6/cubetexture.png"
  ),
  url_test(
    "/samples/webgl/sample6/glUtils.js",
    "http://mdn.github.io/webgl-examples/tutorial/glUtils.js"
  ),
  url_test(
    "/samples/webgl/sample6/index.html",
    "http://mdn.github.io/webgl-examples/tutorial/sample6/index.html"
  ),
  url_test(
    "/samples/webgl/sample6/sylvester.js",
    "http://mdn.github.io/webgl-examples/tutorial/sylvester.js"
  ),
  url_test(
    "/samples/webgl/sample6/webgl-demo.js",
    "http://mdn.github.io/webgl-examples/tutorial/sample6/webgl-demo.js"
  ),
  url_test(
    "/samples/webgl/sample6/webgl.css",
    "http://mdn.github.io/webgl-examples/tutorial/webgl.css"
  ),
  url_test(
    "/samples/webgl/sample7",
    "http://mdn.github.io/webgl-examples/tutorial/sample7"
  ),
  url_test(
    "/samples/webgl/sample7/cubetexture.png",
    "http://mdn.github.io/webgl-examples/tutorial/sample7/cubetexture.png"
  ),
  url_test(
    "/samples/webgl/sample7/glUtils.js",
    "http://mdn.github.io/webgl-examples/tutorial/glUtils.js"
  ),
  url_test(
    "/samples/webgl/sample7/index.html",
    "http://mdn.github.io/webgl-examples/tutorial/sample7/index.html"
  ),
  url_test(
    "/samples/webgl/sample7/sylvester.js",
    "http://mdn.github.io/webgl-examples/tutorial/sylvester.js"
  ),
  url_test(
    "/samples/webgl/sample7/webgl-demo.js",
    "http://mdn.github.io/webgl-examples/tutorial/sample7/webgl-demo.js"
  ),
  url_test(
    "/samples/webgl/sample7/webgl.css",
    "http://mdn.github.io/webgl-examples/tutorial/webgl.css"
  ),
  url_test(
    "/samples/webgl/sample8",
    "http://mdn.github.io/webgl-examples/tutorial/sample8"
  ),
  url_test(
    "/samples/webgl/sample8/Firefox.ogv",
    "http://mdn.github.io/webgl-examples/tutorial/sample8/Firefox.ogv"
  ),
  url_test(
    "/samples/webgl/sample8/glUtils.js",
    "http://mdn.github.io/webgl-examples/tutorial/glUtils.js"
  ),
  url_test(
    "/samples/webgl/sample8/index.html",
    "http://mdn.github.io/webgl-examples/tutorial/sample8/index.html"
  ),
  url_test(
    "/samples/webgl/sample8/sylvester.js",
    "http://mdn.github.io/webgl-examples/tutorial/sylvester.js"
  ),
  url_test(
    "/samples/webgl/sample8/webgl-demo.js",
    "http://mdn.github.io/webgl-examples/tutorial/sample8/webgl-demo.js"
  ),
  url_test(
    "/samples/webgl/sample8/webgl.css",
    "http://mdn.github.io/webgl-examples/tutorial/webgl.css"
  )
);

const MOZILLADEMOS_URLS = [].concat(
  url_test(
    "/samples/canvas-tutorial/images/backdrop.png",
    "https://mdn.mozillademos.org/files/5395/backdrop.png"
  ),
  url_test(
    "/samples/canvas-tutorial/images/bg_gallery.png",
    "https://mdn.mozillademos.org/files/5415/bg_gallery.png"
  ),
  url_test(
    "/samples/canvas-tutorial/images/gallery_1.jpg",
    "https://mdn.mozillademos.org/files/5399/gallery_1.jpg"
  ),
  url_test(
    "/samples/canvas-tutorial/images/gallery_2.jpg",
    "https://mdn.mozillademos.org/files/5401/gallery_2.jpg"
  ),
  url_test(
    "/samples/canvas-tutorial/images/gallery_3.jpg",
    "https://mdn.mozillademos.org/files/5403/gallery_3.jpg"
  ),
  url_test(
    "/samples/canvas-tutorial/images/gallery_4.jpg",
    "https://mdn.mozillademos.org/files/5405/gallery_4.jpg"
  ),
  url_test(
    "/samples/canvas-tutorial/images/gallery_5.jpg",
    "https://mdn.mozillademos.org/files/5407/gallery_5.jpg"
  ),
  url_test(
    "/samples/canvas-tutorial/images/gallery_6.jpg",
    "https://mdn.mozillademos.org/files/5409/gallery_6.jpg"
  ),
  url_test(
    "/samples/canvas-tutorial/images/gallery_7.jpg",
    "https://mdn.mozillademos.org/files/5411/gallery_7.jpg"
  ),
  url_test(
    "/samples/canvas-tutorial/images/gallery_8.jpg",
    "https://mdn.mozillademos.org/files/5413/gallery_8.jpg"
  ),
  url_test(
    "/samples/canvas-tutorial/images/picture_frame.png",
    "https://mdn.mozillademos.org/files/242/Canvas_picture_frame.png"
  ),
  url_test(
    "/samples/canvas-tutorial/images/rhino.jpg",
    "https://mdn.mozillademos.org/files/5397/rhino.jpg"
  ),
  url_test(
    "/samples/canvas-tutorial/images/wallpaper.png",
    "https://mdn.mozillademos.org/files/222/Canvas_createpattern.png"
  )
);

const DEFAULT_SAMPLES_URLS = [].concat(
  url_test("/samples/cssref/background.html", null, { statusCode: 302 }),
  url_test("/samples/html/progress.html", null, { statusCode: 302 })
);

const LEGACY_URLS = [].concat(
  // url_test("/index.php", null, { statusCode: 404 }),
  // url_test(
  //     "/index.php?title=Special:Recentchanges&feed=atom", null, { statusCode: 404 }
  // ),
  // url_test("/index.php?title=En/HTML/Canvas&revision=11", null, { statusCode: 404 }),
  // url_test("/index.php?title=En/HTML/Canvas&revision=11", null, { statusCode: 404 }),
  // url_test("/patches", null, { statusCode: 404 }),
  // url_test("/patches/foo", null, { statusCode: 404 }),
  // url_test("/web-tech", null, { statusCode: 404 }),
  // url_test("/web-tech/feed/atom/", null, { statusCode: 404 }),
  // url_test("/css/wiki.css", null, { statusCode: 404 }),
  // url_test("/css/base.css", null, { statusCode: 404 }),
  url_test("/contests", "http://www.mozillalabs.com/", { statusCode: 302 }),
  url_test("/contests/", "http://www.mozillalabs.com/", { statusCode: 302 }),
  url_test("/contests/extendfirefox/faq.php", "http://www.mozillalabs.com/", {
    statusCode: 302,
  }),
  url_test("/es4", "http://www.ecma-international.org/memento/TC39.htm", {
    statusCode: 302,
  }),
  url_test("/es4/", "http://www.ecma-international.org/memento/TC39.htm", {
    statusCode: 302,
  }),
  url_test(
    "/es4/proposals/slice_syntax.html",
    "http://www.ecma-international.org/memento/TC39.htm",
    { statusCode: 302 }
  )
  // TODO: implement locale redirects
  // url_test(
  //   "/en/docs/Web/CSS/Attribute_selectors",
  //   "/en-US/docs/Web/CSS/Attribute_selectors",
  //   { statusCode: 302 }
  // ),
  // url_test(
  //   "/en/docs/Web/CSS/Attribute_selectors",
  //   "/en-US/docs/Web/CSS/Attribute_selectors",
  //   { statusCode: 302 }
  // ),
  // url_test("/cn/docs/Talk:Kakurady", "/zh-CN/docs/Talk:Kakurady", {
  //   statusCode: 302,
  // }),
  // url_test(
  //   "/zh_cn/docs/Web/API/RTCPeerConnection/addTrack",
  //   "/zh-CN/docs/Web/API/RTCPeerConnection/addTrack",
  //   { statusCode: 302 }
  // ),
  // url_test("/zh_tw/docs/AJAX", "/zh-TW/docs/AJAX", { statusCode: 302 })
);

const ZONE_REDIRECTS = [
  [
    "Add-ons",
    "Mozilla/Add-ons",
    "WebExtensions",
    [
      "ar",
      "bn",
      "ca",
      "de",
      "en-US",
      "es",
      "fa",
      "fr",
      "hu",
      "id",
      "it",
      "ja",
      "ms",
      "nl",
      "pl",
      "pt-BR",
      "pt-PT",
      "ru",
      "sv-SE",
      "th",
      "uk",
      "vi",
      "zh-CN",
      "zh-TW",
      null,
    ],
  ],
  ["Add-ons", "Mozilla/Πρόσθετα", "WebExtensions", ["el"]],
  ["Add-ons", "Mozilla/애드온들", "WebExtensions", ["ko"]],
  ["Add-ons", "Mozilla/Eklentiler", "WebExtensions", ["tr"]],
  [
    "Firefox",
    "Mozilla/Firefox",
    "Privacy",
    [
      "ar",
      "bm",
      "ca",
      "de",
      "el",
      "en-US",
      "es",
      "fi",
      "fr",
      "he",
      "hi-IN",
      "hu",
      "id",
      "it",
      "ja",
      "ko",
      "ms",
      "my",
      "nl",
      "pl",
      "pt-BR",
      "pt-PT",
      "ru",
      "sv-SE",
      "th",
      "tr",
      "vi",
      "zh-CN",
      "zh-TW",
      null,
    ],
  ],
  ["Firefox", "Mozilla/ফায়ারফক্স", "Privacy", ["bn"]],
  [
    "Apps",
    "Web/Apps",
    "Tutorials",
    ["en-US", "fa", "fr", "ja", "th", "zh-CN", "zh-TW", null],
  ],
  ["Apps", "Web/Aplicaciones", "Tutorials", ["es"]],
  ["Apps", "Apps", "Tutorials", ["bn", "de", "it", "ko", "pt-BR", "ru"]],
  // TODO: inconsistent also in SCL3
  // ["Learn", "Learn", "JavaScript", ["ca", "de", null]],
  ["Apprendre", "Apprendre", "JavaScript", ["fr"]],
  [
    "Marketplace",
    "Mozilla/Marketplace",
    "APIs",
    ["de", "en-US", "es", "fr", "it", "ja", "zh-CN", null],
  ],
  ["Marketplace", "Mozilla/بازار", "APIs", ["fa"]],
];

const ZONE_REDIRECT_URLS = [];
for (const [zoneRoot, wikiSlug, childPath, locales] of ZONE_REDIRECTS) {
  for (const locale of locales) {
    const prefix = locale ? `/${locale}` : "";
    const redirectPath = `${prefix}/docs/${wikiSlug}`;
    const paths = [`${prefix}/${zoneRoot}`];
    // Test with a "docs" based path as well if it makes sense.
    if (zoneRoot != wikiSlug) {
      paths.push(`${prefix}/docs/${zoneRoot}`);
    }
    for (const path of paths) {
      // The zone root without a trailing slash.
      ZONE_REDIRECT_URLS.push(
        ...url_test(path, redirectPath, { statusCode: 302 })
      );
      // The zone root with a trailing slash.
      ZONE_REDIRECT_URLS.push(
        ...url_test(`${path}/`, redirectPath, { statusCode: 302 })
      );
      // A zone child page with query parameters.
      ZONE_REDIRECT_URLS.push(
        ...url_test(
          `${path}/${childPath}?raw&macros`,
          `${redirectPath}/${childPath}?raw&macros`,
          { statusCode: 302 }
        )
      );
      // The zone root with $edit.
      ZONE_REDIRECT_URLS.push(
        ...url_test(`${path}$edit`, `${redirectPath}$edit`, {
          statusCode: 302,
        })
      );
      // A zone path with curly braces {}
      ZONE_REDIRECT_URLS.push(
        ...url_test(`${path}/{test}`, `${redirectPath}/{test}`, {
          statusCode: 302,
        })
      );
    }
  }
}

const REDIRECT_URLS = [].concat(
  url_test(
    "/en-US/fellowship",
    "/en-US/docs/Archive/2015_MDN_Fellowship_Program"
  )
);

const marionette_client_docs_url =
  "https://marionette-client.readthedocs.io/en/latest/";
const marionette_docs_root_url =
  "https://firefox-source-docs.mozilla.org/testing/marionette/marionette/";
const marionette_locales = "{/en-US,/fr,/ja,/pl,/pt-BR,/ru,/zh-CN,}";
const marionette_base = `${marionette_locales}/docs/Mozilla/QA/Marionette`;
const marionette_multi_base = `${marionette_locales}/docs/{Mozilla/QA/,}Marionette`;
const marionette_python_tests =
  "{MarionetteTestCase,Marionette_Python_Tests,Running_Tests,Tests}";

const MARIONETTE_URLS = [].concat(
  url_test(marionette_multi_base, `${marionette_docs_root_url}index.html`),
  url_test(
    `${marionette_multi_base}/Builds`,
    `${marionette_docs_root_url}Building.html`
  ),
  url_test(`${marionette_multi_base}/Client`, marionette_client_docs_url),
  url_test(
    `${marionette_multi_base}/Developer_setup`,
    `${marionette_docs_root_url}Contributing.html`
  ),
  url_test(
    `${marionette_multi_base}/${marionette_python_tests}`,
    `${marionette_docs_root_url}PythonTests.html`
  ),
  url_test(
    `${marionette_locales}/docs/Marionette_Test_Runner`,
    `${marionette_docs_root_url}PythonTests.html`
  ),
  url_test(
    `${marionette_base}/Marionette_Test_Runner`,
    `${marionette_docs_root_url}PythonTests.html`
  ),
  url_test(
    `${marionette_base}/Protocol`,
    `${marionette_docs_root_url}Protocol.html`
  ),
  url_test(`${marionette_base}/Python_Client`, marionette_client_docs_url),
  url_test(
    `${marionette_base}/WebDriver/status`,
    "https://bugzilla.mozilla.org/showdependencytree.cgi?id=721859&hide_resolved=1"
  ),
  url_test(
    `${marionette_locales}/docs/Marionette/Debugging`,
    `${marionette_docs_root_url}Debugging.html`
  )
);

const WEBEXT_URLS = [].concat(
  [
    [
      "WebExtensions/Security_best_practices",
      "develop/build-a-secure-extension/",
    ],
    [
      "WebExtensions/user_interface/Accessibility_guidelines",
      "develop/build-an-accessible-extension/",
    ],
    [
      "WebExtensions/onboarding_upboarding_offboarding_best_practices",
      "develop/onboard-upboard-offboard-users/",
    ],
    [
      "WebExtensions/Porting_a_Google_Chrome_extension",
      "develop/porting-a-google-chrome-extension/",
    ],
    [
      "WebExtensions/Porting_a_legacy_Firefox_add-on",
      "develop/porting-a-legacy-firefox-extension/",
    ],
    [
      "WebExtensions/Comparison_with_the_Add-on_SDK",
      "develop/comparison-with-the-add-on-sdk/",
    ],
    [
      "WebExtensions/Comparison_with_XUL_XPCOM_extensions",
      "develop/comparison-with-xul-xpcom-extensions/",
    ],
    [
      "WebExtensions/Differences_between_desktop_and_Android",
      "develop/differences-between-desktop-and-android-extensions/",
    ],
    [
      "WebExtensions/Development_Tools",
      "develop/browser-extension-development-tools/",
    ],
    [
      "WebExtensions/Choose_a_Firefox_version_for_web_extension_develop",
      "develop/choosing-a-firefox-version-for-extension-development/",
    ],
    [
      "WebExtensions/User_experience_best_practices",
      "develop/user-experience-best-practices/",
    ],
    [
      "WebExtensions/Prompt_users_for_data_and_privacy_consents",
      "develop/best-practices-for-collecting-user-data-consents/",
    ],
    [
      "WebExtensions/Temporary_Installation_in_Firefox",
      "develop/temporary-installation-in-firefox/",
    ],
    ["WebExtensions/Debugging", "develop/debugging/"],
    [
      "WebExtensions/Testing_persistent_and_restart_features",
      "develop/testing-persistent-and-restart-features/",
    ],
    [
      "WebExtensions/Test_permission_requests",
      "develop/test-permission-requests/",
    ],
    [
      "WebExtensions/Developing_WebExtensions_for_Firefox_for_Android",
      "develop/developing-extensions-for-firefox-for-android/",
    ],
    [
      "WebExtensions/Getting_started_with_web-ext",
      "develop/getting-started-with-web-ext/",
    ],
    [
      "WebExtensions/web-ext_command_reference",
      "develop/web-ext-command-reference/",
    ],
    [
      "WebExtensions/WebExtensions_and_the_Add-on_ID",
      "develop/extensions-and-the-add-on-id/",
    ],
    [
      "WebExtensions/Request_the_right_permissions",
      "develop/request-the-right-permissions/",
    ],
    [
      "WebExtensions/Best_practices_for_updating_your_extension",
      "manage/best-practices-for-updating/",
    ],
    ["Updates", "manage/updating-your-extension/"],
    [
      "WebExtensions/Distribution_options",
      "publish/signing-and-distribution-overview/",
    ],
    [
      "Themes/Using_the_AMO_theme_generator",
      "themes/using-the-amo-theme-generator/",
    ],
    ["WebExtensions/Developer_accounts", "publish/developer-accounts/"],
    [
      "Distribution",
      "publish/signing-and-distribution-overview/#distributing-your-addon",
    ],
    [
      "WebExtensions/Package_your_extension_",
      "publish/package-your-extension/",
    ],
    ["Distribution/Submitting_an_add-on", "publish/submitting-an-add-on/"],
    ["Source_Code_Submission", "publish/source-code-submission/"],
    [
      "Distribution/Resources_for_publishers",
      "manage/resources-for-publishers/",
    ],
    ["Listing", "develop/create-an-appealing-listing/"],
    [
      "Distribution/Make_money_from_browser_extensions",
      "publish/make-money-from-browser-extensions/",
    ],
    [
      "Distribution/Promoting_your_extension_or_theme",
      "publish/promoting-your-extension/",
    ],
    ["AMO/Policy/Reviews", "publish/add-on-policies/"],
    ["AMO/Policy/Agreement", "publish/firefox-add-on-distribution-agreement/"],
    ["Distribution/Retiring_your_extension", "manage/retiring-your-extension/"],
    [
      "WebExtensions/Distribution_options/Sideloading_add-ons",
      "publish/distribute-sideloading/",
    ],
    [
      "WebExtensions/Distribution_options/Add-ons_for_desktop_apps",
      "publish/distribute-for-desktop-apps/",
    ],
    [
      "WebExtensions/Distribution_options/Add-ons_in_the_enterprise",
      "enterprise/",
    ],
    ["AMO/Blocking_Process", "publish/add-ons-blocking-process/"],
    ["Third_Party_Library_Usage", "publish/third-party-library-usage/"],
    [
      "WebExtensions/What_does_review_rejection_mean_to_users",
      "publish/what-does-review-rejection-mean-to-users/",
    ],
    ["AMO/Policy/Featured", "publish/recommended-extensions/"],
  ].flatMap(([aoPath, ewPath]) =>
    url_test(
      `{/en-US,/fr,}/docs/Mozilla/Add-ons/${aoPath}`,
      `https://extensionworkshop.com/documentation/${ewPath}`
    )
  )
);

const FIREFOX_ACCOUNTS_URLS = [].concat(
  url_test(
    "{/en-US,}/{docs/,}Mozilla/Firefox_Accounts_OAuth_Dashboard{/,}",
    "https://mozilla.github.io/ecosystem-platform/docs/welcome"
  ),
  url_test(
    "{/en-US,/pl,}/{docs/,}Mozilla/{Tech/,}Firefox_Accounts{/Introduction,/Atttached_APIs,/WebExtensions,}",
    "https://mozilla.github.io/ecosystem-platform/docs/welcome"
  ),
  url_test(
    "{/en-US,/pl,}/{docs/,}Archive/Mozilla/Firefox/Accounts{/Introduction,/Atttached_APIs,/WebExtensions,}",
    "https://mozilla.github.io/ecosystem-platform/docs/welcome"
  )
);

const FIREFOX_SOURCE_DOCS_URLS = [].concat(
  url_test(
    "{/en-US,/pl,}/{docs/,}Mozilla/Memory_Sanitizer",
    "https://firefox-source-docs.mozilla.org/tools/sanitizer/memory_sanitizer.html#memory-sanitizer"
  ),
  url_test(
    "{/en-US,/pl,}/{docs/,}Debugging_Mozilla_with_gdb",
    "https://firefox-source-docs.mozilla.org/contributing/debugging/debugging_firefox_with_gdb.html"
  ),
  url_test(
    "{/en-US,/pl,}/{docs/,}Debugging_Mozilla_with_lldb",
    "https://firefox-source-docs.mozilla.org/contributing/debugging/debugging_firefox_with_lldb.html"
  ),
  url_test(
    "{/en-US,/pl,}/{docs/,}Understanding_crash_reports",
    "https://firefox-source-docs.mozilla.org/contributing/debugging/understanding_crash_reports.html"
  ),
  url_test(
    "{/en-US,/pl,}/{docs/,}Debugging_a_minidump",
    "https://firefox-source-docs.mozilla.org/contributing/debugging/debugging_a_minidump.html"
  ),
  url_test(
    "{/en-US,/pl,}/{docs/,}Debugging_Mozilla_with_Valgrind",
    "https://firefox-source-docs.mozilla.org/contributing/debugging/debugging_firefox_with_valgrind.html"
  ),
  url_test(
    "{/en-US,/pl,}/{docs/,}Debugging/Record_and_Replay_Debugging_Firefox",
    "https://firefox-source-docs.mozilla.org/contributing/debugging/debugging_firefox_with_rr.html"
  )
);

const LOCALE_ALIAS_URLS = [].concat(
  url_test("/en-US/docs/Foo/bar", null, { statusCode: 404 }),
  url_test("/eN-uS/docs/Foo/bar", null, { statusCode: 404 }),
  url_test("/en-au/docs/Foo/bar", null, { statusCode: 404 }),
  url_test("/en-gb/docs/Foo/bar", null, { statusCode: 404 }),
  url_test("/en_gb/docs/Foo/bar", null, { statusCode: 404 }),

  url_test("/PT-PT/docs/Foo/bar", "/en-US/docs/Foo/bar?retiredLocale=pt-PT", {
    statusCode: 302,
  }),
  url_test("/XY-PQ/docs/Foo/bar", null, { statusCode: 404 }),

  url_test("/en/docs/Foo/bar", "/en-US/docs/Foo/bar"),
  url_test("/En_uS/docs/Foo/bar", "/en-US/docs/Foo/bar"),
  url_test("/pt/docs/Foo/bar", "/pt-BR/docs/Foo/bar"),
  url_test("/Fr-FR/docs/Foo/bar", "/fr/docs/Foo/bar"),
  url_test("/JA-JP/docs/Foo/bar", "/ja/docs/Foo/bar"),
  url_test("/JA-JA/docs/Foo/bar", "/ja/docs/Foo/bar"),
  url_test("/JA-JX/docs/Foo/bar", "/ja/docs/Foo/bar"),
  url_test("/fR-SW/docs/Foo/bar", "/fr/docs/Foo/bar"),
  url_test("/zh-HAnt/docs/Foo/bar", "/zh-TW/docs/Foo/bar"),
  url_test("/zH-HAns/docs/Foo/bar", "/zh-CN/docs/Foo/bar"),
  url_test("/zh/docs/Foo/bar", "/zh-CN/docs/Foo/bar"),
  url_test("/cn/docs/Foo/bar", "/zh-CN/docs/Foo/bar"),

  // No suffix
  url_test("/en", "/en-US/"),
  url_test("/en/", "/en-US/"),
  url_test("/En_uS", "/en-US/"),
  url_test("/Fr-FR", "/fr/"),
  url_test("/zh", "/zh-CN/")
);

const RETIRED_LOCALE_URLS = [].concat(
  url_test("/ar", "/en-US/?retiredLocale=ar", { statusCode: 302 }),
  url_test("/ar/", "/en-US/?retiredLocale=ar", { statusCode: 302 }),
  url_test("/bg", "/en-US/?retiredLocale=bg", { statusCode: 302 }),
  url_test("/bg/", "/en-US/?retiredLocale=bg", { statusCode: 302 }),
  url_test("/bn", "/en-US/?retiredLocale=bn", { statusCode: 302 }),
  url_test("/bn/", "/en-US/?retiredLocale=bn", { statusCode: 302 }),
  url_test("/ca", "/en-US/?retiredLocale=ca", { statusCode: 302 }),
  url_test("/ca/", "/en-US/?retiredLocale=ca", { statusCode: 302 }),
  url_test("/el", "/en-US/?retiredLocale=el", { statusCode: 302 }),
  url_test("/el/", "/en-US/?retiredLocale=el", { statusCode: 302 }),
  url_test("/fa", "/en-US/?retiredLocale=fa", { statusCode: 302 }),
  url_test("/FA/", "/en-US/?retiredLocale=fa", { statusCode: 302 }),
  url_test("/fi", "/en-US/?retiredLocale=fi", { statusCode: 302 }),
  url_test("/fi/", "/en-US/?retiredLocale=fi", { statusCode: 302 }),
  url_test("/he", "/en-US/?retiredLocale=he", { statusCode: 302 }),
  url_test("/he/", "/en-US/?retiredLocale=he", { statusCode: 302 }),
  url_test("/hi-In", "/en-US/?retiredLocale=hi-IN", { statusCode: 302 }),
  url_test("/hi-IN/", "/en-US/?retiredLocale=hi-IN", { statusCode: 302 }),
  url_test("/hu", "/en-US/?retiredLocale=hu", { statusCode: 302 }),
  url_test("/hu/", "/en-US/?retiredLocale=hu", { statusCode: 302 }),
  url_test("/id", "/en-US/?retiredLocale=id", { statusCode: 302 }),
  url_test("/ID/", "/en-US/?retiredLocale=id", { statusCode: 302 }),
  url_test("/it", "/en-US/?retiredLocale=it", { statusCode: 302 }),
  url_test("/it/", "/en-US/?retiredLocale=it", { statusCode: 302 }),
  url_test("/kab", "/en-US/?retiredLocale=kab", { statusCode: 302 }),
  url_test("/KaB/", "/en-US/?retiredLocale=kab", { statusCode: 302 }),
  url_test("/ms", "/en-US/?retiredLocale=ms", { statusCode: 302 }),
  url_test("/ms/", "/en-US/?retiredLocale=ms", { statusCode: 302 }),
  url_test("/my", "/en-US/?retiredLocale=my", { statusCode: 302 }),
  url_test("/my/", "/en-US/?retiredLocale=my", { statusCode: 302 }),
  url_test("/nl", "/en-US/?retiredLocale=nl", { statusCode: 302 }),
  url_test("/nl/", "/en-US/?retiredLocale=nl", { statusCode: 302 }),
  url_test("/pt-Pt", "/en-US/?retiredLocale=pt-PT", { statusCode: 302 }),
  url_test("/pt-PT/", "/en-US/?retiredLocale=pt-PT", { statusCode: 302 }),
  url_test("/sv-SE", "/en-US/?retiredLocale=sv-SE", { statusCode: 302 }),
  url_test("/sv-se/", "/en-US/?retiredLocale=sv-SE", { statusCode: 302 }),
  url_test("/th", "/en-US/?retiredLocale=th", { statusCode: 302 }),
  url_test("/th/", "/en-US/?retiredLocale=th", { statusCode: 302 }),
  url_test("/tr", "/en-US/?retiredLocale=tr", { statusCode: 302 }),
  url_test("/tr/", "/en-US/?retiredLocale=tr", { statusCode: 302 }),
  url_test("/uk", "/en-US/?retiredLocale=uk", { statusCode: 302 }),
  url_test("/uk/", "/en-US/?retiredLocale=uk", { statusCode: 302 }),
  url_test("/vi", "/en-US/?retiredLocale=vi", { statusCode: 302 }),
  url_test("/vi/", "/en-US/?retiredLocale=vi", { statusCode: 302 }),
  url_test("/ar/docs/Web", "/en-US/docs/Web?retiredLocale=ar", {
    statusCode: 302,
  }),
  url_test("/bg/docs/Web/", "/en-US/docs/Web/?retiredLocale=bg", {
    statusCode: 302,
  }),
  url_test("/bn/docs/Web", "/en-US/docs/Web?retiredLocale=bn", {
    statusCode: 302,
  }),
  url_test("/Ca/docs/Web/", "/en-US/docs/Web/?retiredLocale=ca", {
    statusCode: 302,
  }),
  url_test("/el/docs/Web", "/en-US/docs/Web?retiredLocale=el", {
    statusCode: 302,
  }),
  url_test("/FA/docs/Web", "/en-US/docs/Web?retiredLocale=fa", {
    statusCode: 302,
  }),
  url_test("/fi/docs/Web", "/en-US/docs/Web?retiredLocale=fi", {
    statusCode: 302,
  }),
  url_test("/he/docs/Web", "/en-US/docs/Web?retiredLocale=he", {
    statusCode: 302,
  }),
  url_test("/hi-IN/docs/Web", "/en-US/docs/Web?retiredLocale=hi-IN", {
    statusCode: 302,
  }),
  url_test("/hu/docs/Web", "/en-US/docs/Web?retiredLocale=hu", {
    statusCode: 302,
  }),
  url_test("/ID/docs/Web", "/en-US/docs/Web?retiredLocale=id", {
    statusCode: 302,
  }),
  url_test("/it/docs/Web", "/en-US/docs/Web?retiredLocale=it", {
    statusCode: 302,
  }),
  url_test("/KaB/docs/Web", "/en-US/docs/Web?retiredLocale=kab", {
    statusCode: 302,
  }),
  url_test("/ms/docs/Web", "/en-US/docs/Web?retiredLocale=ms", {
    statusCode: 302,
  }),
  url_test("/my/docs/Web", "/en-US/docs/Web?retiredLocale=my", {
    statusCode: 302,
  }),
  url_test("/nl/docs/Web", "/en-US/docs/Web?retiredLocale=nl", {
    statusCode: 302,
  }),
  url_test("/pt-PT/docs/Web", "/en-US/docs/Web?retiredLocale=pt-PT", {
    statusCode: 302,
  }),
  url_test("/sv-se/docs/Web", "/en-US/docs/Web?retiredLocale=sv-SE", {
    statusCode: 302,
  }),
  url_test("/th/docs/Web", "/en-US/docs/Web?retiredLocale=th", {
    statusCode: 302,
  }),
  url_test("/tr/docs/Web", "/en-US/docs/Web?retiredLocale=tr", {
    statusCode: 302,
  }),
  url_test("/uk/docs/Web", "/en-US/docs/Web?retiredLocale=uk", {
    statusCode: 302,
  }),
  url_test("/vi/docs/Web", "/en-US/docs/Web?retiredLocale=vi", {
    statusCode: 302,
  }),
  url_test("/ar/search?q=video", "/en-US/search?q=video&retiredLocale=ar", {
    statusCode: 302,
  }),
  url_test("/bg/search?q=video", "/en-US/search?q=video&retiredLocale=bg", {
    statusCode: 302,
  }),
  url_test("/bn/search?q=video", "/en-US/search?q=video&retiredLocale=bn", {
    statusCode: 302,
  }),
  url_test("/Ca/search?q=video", "/en-US/search?q=video&retiredLocale=ca", {
    statusCode: 302,
  }),
  url_test("/el/search?q=video", "/en-US/search?q=video&retiredLocale=el", {
    statusCode: 302,
  }),
  url_test("/FA/search?q=video", "/en-US/search?q=video&retiredLocale=fa", {
    statusCode: 302,
  }),
  url_test("/fi/search?q=video", "/en-US/search?q=video&retiredLocale=fi", {
    statusCode: 302,
  }),
  url_test("/he/search?q=video", "/en-US/search?q=video&retiredLocale=he", {
    statusCode: 302,
  }),
  url_test(
    "/hi-IN/search?q=video",
    "/en-US/search?q=video&retiredLocale=hi-IN",
    { statusCode: 302 }
  ),
  url_test("/hu/search?q=video", "/en-US/search?q=video&retiredLocale=hu", {
    statusCode: 302,
  }),
  url_test("/ID/search?q=video", "/en-US/search?q=video&retiredLocale=id", {
    statusCode: 302,
  }),
  url_test("/it/search?q=video", "/en-US/search?q=video&retiredLocale=it", {
    statusCode: 302,
  }),
  url_test("/KaB/search?q=video", "/en-US/search?q=video&retiredLocale=kab", {
    statusCode: 302,
  }),
  url_test("/ms/search?q=video", "/en-US/search?q=video&retiredLocale=ms", {
    statusCode: 302,
  }),
  url_test("/my/search?q=video", "/en-US/search?q=video&retiredLocale=my", {
    statusCode: 302,
  }),
  url_test("/nl/search?q=video", "/en-US/search?q=video&retiredLocale=nl", {
    statusCode: 302,
  }),
  url_test(
    "/pt-PT/search?q=video",
    "/en-US/search?q=video&retiredLocale=pt-PT",
    { statusCode: 302 }
  ),
  url_test(
    "/sv-se/search?q=video",
    "/en-US/search?q=video&retiredLocale=sv-SE",
    { statusCode: 302 }
  ),
  url_test("/th/search?q=video", "/en-US/search?q=video&retiredLocale=th", {
    statusCode: 302,
  }),
  url_test("/tr/search?q=video", "/en-US/search?q=video&retiredLocale=tr", {
    statusCode: 302,
  }),
  url_test("/uk/search?q=video", "/en-US/search?q=video&retiredLocale=uk", {
    statusCode: 302,
  }),
  url_test("/vi/search?q=video", "/en-US/search?q=video&retiredLocale=vi", {
    statusCode: 302,
  })
);

const ARCHIVED_TO_GITHUB_URLS = [].concat(
  url_test("/en-US/docs/Mozilla/Projects/NSS/Foo", "xxx", { statusCode: 302 })
);

const MISC_REDIRECT_URLS = [].concat(
  url_test("/fr/account", "/fr/settings", { statusCode: 302 }),
  url_test("/en-US/account", "/en-US/settings", { statusCode: 302 }),
  url_test("/en-US/account/", "/en-US/settings", { statusCode: 302 }),
  url_test("/ja/profile", "/ja/settings", { statusCode: 302 }),
  url_test("/en-US/profile", "/en-US/settings", { statusCode: 302 }),
  url_test("/en-US/profile/", "/en-US/settings", { statusCode: 302 }),
  url_test("/en-US/profile/edit", "/en-US/settings", { statusCode: 302 }),
  url_test("/en-US/profile/edit/", "/en-US/settings", { statusCode: 302 }),
  url_test("/en-US/profile/stripe_subscription", "/en-US/settings", {
    statusCode: 302,
  }),
  url_test("/en-US/profile/stripe_subscription/", "/en-US/settings", {
    statusCode: 302,
  }),
  url_test("/zh-CN/profiles/sheppy", "/zh-CN/settings", { statusCode: 302 }),
  url_test("/en-US/profiles/sheppy", "/en-US/settings", { statusCode: 302 }),
  url_test("/en-US/profiles/sheppy/", "/en-US/settings", { statusCode: 302 }),
  url_test("/en-US/profiles/sheppy/edit", "/en-US/settings", {
    statusCode: 302,
  }),
  url_test("/en-US/profiles/sheppy/edit/", "/en-US/settings", {
    statusCode: 302,
  }),
  url_test("/en-US/profiles/sheppy/delete", "/en-US/settings", {
    statusCode: 302,
  }),
  url_test("/en-US/profiles/sheppy/delete/", "/en-US/settings", {
    statusCode: 302,
  }),
  url_test("/en-US/DOM", "/en-US/docs/DOM"),
  url_test("/en-US/DOM/", "/en-US/docs/DOM"),
  url_test(
    "/en-US/DOM/element.addEventListener",
    "/en-US/docs/DOM/element.addEventListener"
  ),
  url_test("/en-US/DOM/CSSRule/cssText/", "/en-US/docs/DOM/CSSRule/cssText"),
  url_test("/fr/DOM", "/fr/docs/DOM"),
  url_test("/fr/DOM/", "/fr/docs/DOM"),
  url_test(
    "/fr/DOM/element.addEventListener",
    "/fr/docs/DOM/element.addEventListener"
  ),
  url_test("/fr/DOM/CSSRule/cssText/", "/fr/docs/DOM/CSSRule/cssText"),
  url_test("/en-US/AJAX", "/en-US/docs/AJAX"),
  url_test("/en-US/AJAX/", "/en-US/docs/AJAX"),
  url_test("/en-US/AJAX/Getting_Started/", "/en-US/docs/AJAX/Getting_Started"),
  url_test("/en-US/CSS", "/en-US/docs/CSS"),
  url_test("/en-US/CSS/", "/en-US/docs/CSS"),
  url_test("/en-US/CSS/time/", "/en-US/docs/CSS/time"),
  url_test("/en-US/DragDrop", "/en-US/docs/DragDrop"),
  url_test("/en-US/DragDrop/", "/en-US/docs/DragDrop"),
  url_test(
    "/en-US/DragDrop/Drag_and_Drop/",
    "/en-US/docs/DragDrop/Drag_and_Drop"
  ),
  url_test("/en-US/HTML", "/en-US/docs/HTML"),
  url_test("/en-US/HTML/", "/en-US/docs/HTML"),
  url_test("/en-US/HTML/Canvas/", "/en-US/docs/HTML/Canvas"),
  url_test("/en-US/JavaScript", "/en-US/docs/JavaScript"),
  url_test("/en-US/JavaScript/", "/en-US/docs/JavaScript"),
  url_test(
    "/en-US/JavaScript/Reference/About/",
    "/en-US/docs/JavaScript/Reference/About"
  ),
  url_test("/en-US/SVG", "/en-US/docs/SVG"),
  url_test("/en-US/SVG/", "/en-US/docs/SVG"),
  url_test("/en-US/SVG/Element/font/", "/en-US/docs/SVG/Element/font"),
  url_test("/en-US/Tools", "/en-US/docs/Tools"),
  url_test("/en-US/Tools/", "/en-US/docs/Tools"),
  url_test(
    "/en-US/Tools/Memory/Treemap_view/",
    "/en-US/docs/Tools/Memory/Treemap_view"
  ),
  url_test(
    "/en-US/Using_files_from_web_applications",
    "/en-US/docs/Using_files_from_web_applications"
  ),
  url_test(
    "/en-US/Using_files_from_web_applications/",
    "/en-US/docs/Using_files_from_web_applications"
  ),
  url_test("/en-US/Web", "/en-US/docs/Web"),
  url_test("/en-US/Web/", "/en-US/docs/Web"),
  url_test("/en-US/Web/API/ArrayBuffer/", "/en-US/docs/Web/API/ArrayBuffer"),
  url_test("/en-US/XMLHttpRequest", "/en-US/docs/XMLHttpRequest"),
  url_test("/en-US/XMLHttpRequest/", "/en-US/docs/XMLHttpRequest"),
  url_test(
    "/en-US/XMLHttpRequest/FormData/",
    "/en-US/docs/XMLHttpRequest/FormData"
  )
);

describe("scl3 redirects", () => {
  for (const [url, t] of SCL3_REDIRECT_URLS) {
    it(url, t);
  }
});

describe("github io redirects", () => {
  for (const [url, t] of GITHUB_IO_URLS) {
    it(url, t);
  }
});

describe("mozilla demos redirects", () => {
  for (const [url, t] of MOZILLADEMOS_URLS) {
    it(url, t);
  }
});

describe("default samples redirects", () => {
  for (const [url, t] of DEFAULT_SAMPLES_URLS) {
    it(url, t);
  }
});

describe("legacy redirects", () => {
  for (const [url, t] of LEGACY_URLS) {
    it(url, t);
  }
});

describe("zone redirects", () => {
  for (const [url, t] of ZONE_REDIRECT_URLS) {
    it(url, t);
  }
});

describe("one off redirects", () => {
  for (const [url, t] of REDIRECT_URLS) {
    it(url, t);
  }
});

describe("marionette redirects", () => {
  for (const [url, t] of MARIONETTE_URLS) {
    it(url, t);
  }
});

describe("webext redirects", () => {
  for (const [url, t] of WEBEXT_URLS) {
    it(url, t);
  }
});

describe("firefox accounts redirects", () => {
  for (const [url, t] of FIREFOX_ACCOUNTS_URLS) {
    it(url, t);
  }
});

describe("firefox src docs redirects", () => {
  for (const [url, t] of FIREFOX_SOURCE_DOCS_URLS) {
    it(url, t);
  }
});

describe("locale alias redirects", () => {
  for (const [url, t] of LOCALE_ALIAS_URLS) {
    it(url, t);
  }
});

describe("retired locale redirects", () => {
  for (const [url, t] of RETIRED_LOCALE_URLS) {
    it(url, t);
  }
});
describe("archived to GitHub", () => {
  for (const [url, t] of ARCHIVED_TO_GITHUB_URLS) {
    it(url, t);
  }
});

const CORE_JAVASCRIPT_1_5_URLs = [].concat(
  url_test(
    "/en-US/docs/Core_JavaScript_1.5_Reference/Operators/Special_Operators/typeof_Operator",
    "/en-US/docs/Web/JavaScript/Reference/Operators/Special_Operators/typeof_Operator"
  ),
  url_test(
    "/en-US/docs/Core_JavaScript_1.5_Reference:Operators:Special_Operators:typeof_Operator",
    "/en-US/docs/Web/JavaScript/Reference/Operators/Special_Operators/typeof_Operator"
  ),
  url_test(
    "/en-US/docs/Core_JavaScript_1.5_Guide",
    "/en-US/docs/Web/JavaScript/Guide"
  )
);

describe("Core_JavaScript_1.5 redirects", () => {
  for (const [url, t] of CORE_JAVASCRIPT_1_5_URLs) {
    it(url, t);
  }
});

describe("misc redirects", () => {
  for (const [url, t] of MISC_REDIRECT_URLS) {
    it(url, t);
  }
});
