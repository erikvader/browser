function sanitizeNode(node) {
  node.removeAttribute("class");
  node.removeAttribute("id");
  if (node.tagName === "SCRIPT") {
    return null;
  }
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
  }
  for (let c of node.children) {
    sanitizeNode(c);
  }
  return node;
}

module.exports = {sanitizeNode};
