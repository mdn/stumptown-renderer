/**
 * @prettier
 */
const { assert, itMacro, describeMacro, beforeEachMacro } = require("./utils");

// This needs to match what the equivalent is inside the EmbedLiveSample.ejs file.
// Duplicating it here to avoid hardcoding its number in multiple places.
const MIN_HEIGHT = 60;

describeMacro("EmbedLiveSample", function () {
  beforeEachMacro(function (macro) {
    macro.ctx.env.live_samples = {
      base_url: "https://mdn.mozillademos.org",
    };
    macro.ctx.info.hasPage = jest.fn(() => true);
  });
  itMacro("One argument: ID", function (macro) {
    macro.ctx.env.url = "/en-US/docs/Web/HTML/Element/figure";
    return assert.eventually.equal(
      macro.call("Quotations"),
      '<iframe class="sample-code-frame"' +
        ' title="Quotations sample"' +
        ' id="frame_Quotations"' +
        ' src="https://mdn.mozillademos.org/en-US/docs/Web/HTML/Element/figure/_sample_.Quotations.html">' +
        "</iframe>"
    );
  });
  itMacro("One argument: ID with HTML entities (bug?)", function (macro) {
    // Kuma doesn't serve the sample for the generated URL
    macro.ctx.env.url = "/en-US/docs/Web/SVG/Element/switch";
    return assert.eventually.equal(
      macro.call("SVG_&lt;switch&gt;_example"),
      '<iframe class="sample-code-frame"' +
        ' title="SVG &amp;lt;switch&amp;gt; example sample"' +
        ' id="frame_SVG_ltswitchgt_example"' +
        ' src="https://mdn.mozillademos.org/en-US/docs/Web/SVG/Element/switch/_sample_.SVG_ltswitchgt_example.html">' +
        "</iframe>"
    );
  });
  itMacro("One argument: percent-encoded ID", function (macro) {
    macro.ctx.env.url = "/en-US/docs/Web/SVG/Element/switch";
    return assert.eventually.equal(
      macro.call("SVG_%3Cswitch%3E_example"),
      '<iframe class="sample-code-frame"' +
        ' title="SVG %3Cswitch%3E example sample"' +
        ' id="frame_SVG_switch_example"' +
        ' src="https://mdn.mozillademos.org/en-US/docs/Web/SVG/Element/switch/_sample_.SVG_switch_example.html">' +
        "</iframe>"
    );
  });
  itMacro("One argument: ID with percent-encoded page URL", function (macro) {
    macro.ctx.env.url =
      "/fr/docs/Web/CSS/Utilisation_de_d%C3%A9grad%C3%A9s_CSS";
    return assert.eventually.equal(
      macro.call("Dégradés_linéaires_simples"),
      '<iframe class="sample-code-frame"' +
        ' title="Dégradés linéaires simples sample"' +
        ' id="frame_Dégradés_linéaires_simples"' +
        ' src="https://mdn.mozillademos.org/fr/docs/Web/CSS/Utilisation_de_d%C3%A9grad%C3%A9s_CSS/_sample_.D%C3%A9grad%C3%A9s_lin%C3%A9aires_simples.html">' +
        "</iframe>"
    );
  });
  itMacro("One argument: XSS attempt (failed)", function (macro) {
    macro.ctx.env.url = "/en-US/docs/Web/HTML/Element/figure";
    return assert.eventually.equal(
      macro.call('"><script>alert("XSS");</script>'),
      '<iframe class="sample-code-frame"' +
        ' title="&#34;&gt;&lt;script&gt;alert(&#34;XSS&#34;);&lt;/script&gt; sample"' +
        ' id="frame_scriptalertXSSscript"' +
        ' src="https://mdn.mozillademos.org/en-US/docs/Web/HTML/Element/figure/_sample_.scriptalertXSSscript.html">' +
        "</iframe>"
    );
  });
  itMacro("Two arguments: ID, width", function (macro) {
    macro.ctx.env.url = "/en-US/docs/Web/CSS/border-top-width";
    return assert.eventually.equal(
      macro.call("Example", "100%"),
      '<iframe class="sample-code-frame"' +
        ' title="Example sample"' +
        ' id="frame_Example"' +
        ' width="100%"' +
        ' src="https://mdn.mozillademos.org/en-US/docs/Web/CSS/border-top-width/_sample_.Example.html">' +
        "</iframe>"
    );
  });
  itMacro("Two arguments: ID, XSS attempt (failed)", function (macro) {
    macro.ctx.env.url = "/en-US/docs/Web/CSS/border-top-width";
    return assert.eventually.equal(
      macro.call("Example", '"><script>alert("XSS");</script>'),
      '<iframe class="sample-code-frame"' +
        ' title="Example sample"' +
        ' id="frame_Example"' +
        ' width="&#34;&gt;&lt;script&gt;alert(&#34;XSS&#34;);&lt;/script&gt;"' +
        ' src="https://mdn.mozillademos.org/en-US/docs/Web/CSS/border-top-width/_sample_.Example.html">' +
        "</iframe>"
    );
  });
  itMacro("Three arguments: ID, width, height", function (macro) {
    macro.ctx.env.url = "/en-US/docs/Web/HTML/Element/figure";
    return assert.eventually.equal(
      macro.call("Images", "100%", 250),
      '<iframe class="sample-code-frame"' +
        ' title="Images sample"' +
        ' id="frame_Images"' +
        ' width="100%" height="250"' +
        ' src="https://mdn.mozillademos.org/en-US/docs/Web/HTML/Element/figure/_sample_.Images.html">' +
        "</iframe>"
    );
  });
  itMacro("Three arguments: unicode ID, width, height", function (macro) {
    macro.ctx.env.url =
      "/zh-CN/docs/Web/CSS/CSS_Animations/Using_CSS_animations";
    return assert.eventually.equal(
      macro.call("增加关键帧", "100%", "250"),
      '<iframe class="sample-code-frame"' +
        ' title="增加关键帧 sample"' +
        ' id="frame_增加关键帧"' +
        ' width="100%" height="250"' +
        ' src="https://mdn.mozillademos.org/zh-CN/docs/Web/CSS/CSS_Animations/Using_CSS_animations/_sample_.%E5%A2%9E%E5%8A%A0%E5%85%B3%E9%94%AE%E5%B8%A7.html">' +
        "</iframe>"
    );
  });
  itMacro("Three arguments: url-encoded ID, width, height", function (macro) {
    macro.ctx.env.url = "/zh-CN/docs/Web/API/Canvas_API/Tutorial/Basic_usage";
    return assert.eventually.equal(
      macro.call(
        "%E4%B8%80%E4%B8%AA%E6%A8%A1%E6%9D%BF%E9%AA%A8%E6%9E%B6",
        160,
        160
      ),
      '<iframe class="sample-code-frame"' +
        ' title="%E4%B8%80%E4%B8%AA%E6%A8%A1%E6%9D%BF%E9%AA%A8%E6%9E%B6 sample"' +
        ' id="frame_一个模板骨架"' +
        ' width="160" height="160"' +
        ' src="https://mdn.mozillademos.org/zh-CN/docs/Web/API/Canvas_API/Tutorial/Basic_usage/_sample_.%E4%B8%80%E4%B8%AA%E6%A8%A1%E6%9D%BF%E9%AA%A8%E6%9E%B6.html">' +
        "</iframe>"
    );
  });
  itMacro("Three arguments: ID, width, XSS attempt (failed)", function (macro) {
    macro.ctx.env.url = "/en-US/docs/Web/HTML/Element/figure";
    return assert.eventually.equal(
      macro.call("Images", "100%", '"><script>alert("XSS");</script>'),
      '<iframe class="sample-code-frame"' +
        ' title="Images sample"' +
        ' id="frame_Images"' +
        ' width="100%" height="&#34;&gt;&lt;script&gt;alert(&#34;XSS&#34;);&lt;/script&gt;"' +
        ' src="https://mdn.mozillademos.org/en-US/docs/Web/HTML/Element/figure/_sample_.Images.html">' +
        "</iframe>"
    );
  });
  itMacro('Four arguments: ID, width, height, ""', function (macro) {
    macro.ctx.env.url = "/en-US/docs/Web/CSS/::before";
    return assert.eventually.equal(
      macro.call("Adding_quotation_marks", "500", "50", ""),
      '<iframe class="sample-code-frame"' +
        ' title="Adding quotation marks sample"' +
        ' id="frame_Adding_quotation_marks"' +
        ` width="500" height="${MIN_HEIGHT}"` +
        ' src="https://mdn.mozillademos.org/en-US/docs/Web/CSS/::before/_sample_.Adding_quotation_marks.html">' +
        "</iframe>"
    );
  });
  itMacro("Four arguments: ID, width, height, screenshot", function (macro) {
    macro.ctx.env.url = "/en-US/docs/Web/SVG/Tutorial/Gradients";
    return assert.eventually.equal(
      macro.call(
        "SVGLinearGradient",
        "120",
        "240",
        "/files/722/SVG_Linear_Gradient_Example.png"
      ),
      '<table class="sample-code-table"><thead><tr>' +
        '<th scope="col" style="text-align: center;">Screenshot</th>' +
        '<th scope="col" style="text-align: center;">Live sample</th>' +
        "</tr></thead>" +
        "<tbody><tr><td>" +
        '<img alt="" class="internal" src="/files/722/SVG_Linear_Gradient_Example.png" />' +
        "</td><td>" +
        '<iframe class="sample-code-frame"' +
        ' title="SVGLinearGradient sample"' +
        ' id="frame_SVGLinearGradient"' +
        ' width="120" height="240"' +
        ' src="https://mdn.mozillademos.org/en-US/docs/Web/SVG/Tutorial/Gradients/_sample_.SVGLinearGradient.html">' +
        "</iframe></td></tr></tbody></table>"
    );
  });
  itMacro(
    "Four arguments: ID, width, height, XSS attempt (failed)",
    function (macro) {
      macro.ctx.env.url = "/en-US/docs/Web/SVG/Tutorial/Gradients";
      return assert.eventually.equal(
        macro.call(
          "SVGLinearGradient",
          "120",
          "240",
          '"><script>alert("XSS");</script>'
        ),
        '<table class="sample-code-table"><thead><tr>' +
          '<th scope="col" style="text-align: center;">Screenshot</th>' +
          '<th scope="col" style="text-align: center;">Live sample</th>' +
          "</tr></thead>" +
          "<tbody><tr><td>" +
          '<img alt="" class="internal" src="&#34;&gt;&lt;script&gt;alert(&#34;XSS&#34;);&lt;/script&gt;" />' +
          "</td><td>" +
          '<iframe class="sample-code-frame"' +
          ' title="SVGLinearGradient sample"' +
          ' id="frame_SVGLinearGradient"' +
          ' width="120" height="240"' +
          ' src="https://mdn.mozillademos.org/en-US/docs/Web/SVG/Tutorial/Gradients/_sample_.SVGLinearGradient.html">' +
          "</iframe></td></tr></tbody></table>"
      );
    }
  );
  const same_slug_iframe =
    '<iframe class="sample-code-frame"' +
    ' title="Examples sample"' +
    ' id="frame_Examples"' +
    ' width="700px" height="700px"' +
    ' src="https://mdn.mozillademos.org/en-US/docs/Web/CSS/flex-wrap/_sample_.Examples.html">' +
    "</iframe>";
  itMacro('Five arguments: ID, width, height, "", same slug', function (macro) {
    macro.ctx.env.url = "/en-US/docs/Web/CSS/flex-wrap";
    return assert.eventually.equal(
      macro.call("Examples", "700px", "700px", "", "Web/CSS/flex-wrap"),
      same_slug_iframe
    );
  });
  itMacro(
    "Three arguments: ID, width, height (same as Five arg, same slug)",
    function (macro) {
      macro.ctx.env.url = "/en-US/docs/Web/CSS/flex-wrap";
      return assert.eventually.equal(
        macro.call("Examples", "700px", "700px"),
        same_slug_iframe
      );
    }
  );
  itMacro('Five arguments: ID, "", "", "", other slug', function (macro) {
    macro.ctx.env.url = "/en-US/docs/Web/Events/focus";
    return assert.eventually.equal(
      macro.call("Event delegation", "", "", "", "Web/Events/blur"),
      '<iframe class="sample-code-frame"' +
        ' title="Event delegation sample"' +
        ' id="frame_Event_delegation"' +
        ' src="https://mdn.mozillademos.org/en-US/docs/Web/Events/blur/_sample_.Event_delegation.html">' +
        "</iframe>"
    );
  });
  itMacro(
    'Five arguments: ID, "", "", "", other non-existent slug',
    async function (macro) {
      macro.ctx.env.url = "/en-US/docs/Web/Events/focus";
      macro.ctx.info.cleanURL = jest.fn((url) => url.toLowerCase());
      macro.ctx.info.hasPage = jest.fn(() => false);
      await expect(
        macro.call("Event delegation", "", "", "", "Web/Events/blur")
      ).rejects.toThrow(
        "/en-us/docs/web/events/focus references /en-us/docs/web/events/blur, which does not exist"
      );
    }
  );
  itMacro(
    'Five arguments: ID, "", "", "", XSS Attempt (failed)',
    function (macro) {
      macro.ctx.env.url = "/en-US/docs/Web/Events/focus";
      return assert.eventually.equal(
        macro.call(
          "Event_delegation",
          "",
          "",
          "",
          '"><script>alert("XSS");</script>'
        ),
        '<iframe class="sample-code-frame"' +
          ' title="Event delegation sample"' +
          ' id="frame_Event_delegation"' +
          ' src="https://mdn.mozillademos.org/en-US/docs/%22%3E%3Cscript%3Ealert(%22XSS%22);%3C/script%3E/_sample_.Event_delegation.html">' +
          "</iframe>"
      );
    }
  );
  itMacro('Six arguments: ID, width, height, "", "", class', function (macro) {
    macro.ctx.env.url = "/en-US/docs/Web/CSS/-moz-appearance";
    return assert.eventually.equal(
      macro.call("sampleNone", 100, 50, "", "", "nobutton"),
      '<iframe class="nobutton"' +
        ' title="sampleNone sample"' +
        ' id="frame_sampleNone"' +
        ` width="100" height="${MIN_HEIGHT}"` +
        ' src="https://mdn.mozillademos.org/en-US/docs/Web/CSS/-moz-appearance/_sample_.sampleNone.html">' +
        "</iframe>"
    );
  });
  itMacro(
    'Six arguments: ID, width, height, "", "", XSS attempt (failed)',
    function (macro) {
      macro.ctx.env.url = "/en-US/docs/Web/CSS/-moz-appearance";
      return assert.eventually.equal(
        macro.call(
          "sampleNone",
          100,
          50,
          "",
          "",
          '"><script>alert("XSS");</script>'
        ),
        '<iframe class="&#34;&gt;&lt;script&gt;alert(&#34;XSS&#34;);&lt;/script&gt;"' +
          ' title="sampleNone sample"' +
          ' id="frame_sampleNone"' +
          ` width="100" height="${MIN_HEIGHT}"` +
          ' src="https://mdn.mozillademos.org/en-US/docs/Web/CSS/-moz-appearance/_sample_.sampleNone.html">' +
          "</iframe>"
      );
    }
  );
  itMacro(
    'Seven arguments: ID, width, height, "", "", "", features',
    function (macro) {
      macro.ctx.env.url = "/en-US/docs/Web/API/Media_Streams_API/Constraints";
      return assert.eventually.equal(
        macro.call(
          "Example_Constraint_exerciser",
          650,
          800,
          "",
          "",
          "",
          "video; microphone"
        ),
        '<iframe class="sample-code-frame"' +
          ' title="Example Constraint exerciser sample"' +
          ' id="frame_Example_Constraint_exerciser"' +
          ' width="650" height="800"' +
          ' src="https://mdn.mozillademos.org/en-US/docs/Web/API/Media_Streams_API/Constraints/_sample_.Example_Constraint_exerciser.html"' +
          ' allow="video; microphone">' +
          "</iframe>"
      );
    }
  );
  itMacro(
    'Seven arguments: ID, width, height, "", "", "", XSS Attempt (failed)',
    function (macro) {
      macro.ctx.env.url = "/en-US/docs/Web/API/Media_Streams_API/Constraints";
      return assert.eventually.equal(
        macro.call(
          "Example_Constraint_exerciser",
          650,
          800,
          "",
          "",
          "",
          '"><script>alert("XSS");</script>'
        ),
        '<iframe class="sample-code-frame"' +
          ' title="Example Constraint exerciser sample"' +
          ' id="frame_Example_Constraint_exerciser"' +
          ' width="650" height="800"' +
          ' src="https://mdn.mozillademos.org/en-US/docs/Web/API/Media_Streams_API/Constraints/_sample_.Example_Constraint_exerciser.html"' +
          ' allow="&#34;&gt;&lt;script&gt;alert(&#34;XSS&#34;);&lt;/script&gt;">' +
          "</iframe>"
      );
    }
  );
});
