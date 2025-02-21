const dev = {
  documentAccess: "dynamic-page",

  // codegenLanguages: [{ label: "JS", value: "js" }],
  // codegenPreferences: []
};
module.exports = (manifest) => {
  return {
    ...manifest,
    ...dev,
    // ...
  };
};
