const sanitizeHtml = require("sanitize-html");

function sanitizeNode(dirty) {
  return sanitizeHtml(dirty, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
    transformTags: {
      "a": sanitizeHtml.simpleTransform("a", {target: "_blank"}, true)
    }
  });
}

module.exports = {sanitizeNode};
