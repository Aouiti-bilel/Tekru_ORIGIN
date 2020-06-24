/**
 * Expert lib modified
 * Original code: https://gist.github.com/thiagotts/8595549f88ce881553b6
 */

var _ = require('lodash'),
    downsize = require('downsize');

var excerpt = function (html, options) {
    var truncateOptions = (options || {}).hash || {},
        excerpt;

    truncateOptions = _.pick(truncateOptions, ['words', 'characters']);
    _.keys(truncateOptions).map(function (key) {
        truncateOptions[key] = parseInt(truncateOptions[key], 10);
    });

    var excerptTag = "<!--excerpt-->";
    var indexes = getAllIndexesOf(excerptTag, html);

    if (indexes.length > 1) {
        var amountOfSamples = Math.floor(indexes.length / 2);
        var output = [];

        for (var sampleId = 0; sampleId < amountOfSamples; sampleId++) {
            var index1 = sampleId * 2;
            var index2 = index1 + 1;

            var sampleText = html.substring(indexes[index1], indexes[index2] + excerptTag.length);
            output.push(sampleText);
        }

        return (output.join(" (...) "));
    } else {

        /*jslint regexp:true */
        excerpt = String(html);
        // Strip inline and bottom footnotes
        excerpt = excerpt.replace(/<a href="#fn.*?rel="footnote">.*?<\/a>/gi, '');
        excerpt = excerpt.replace(/<div class="footnotes"><ol>.*?<\/ol><\/div>/, '');
        // Strip other html
        excerpt = excerpt.replace(/<\/?[^>]+>/gi, '');
        excerpt = excerpt.replace(/(\r\n|\n|\r)+/gm, ' ');
        /*jslint regexp:false */

        if (!truncateOptions.words && !truncateOptions.characters) {
            truncateOptions.words = 50;
        }

        return (downsize(excerpt, truncateOptions));
    }
};

function getAllIndexesOf(value, fullText) {
    var indexes = [],
        i = -1;
    while ((i = fullText.indexOf(value, i + 1)) != -1) {
        indexes.push(i);
    }
    return indexes;
}

module.exports = excerpt;