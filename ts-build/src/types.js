"use strict";
/* eslint-disable max-lines */
Object.defineProperty(exports, "__esModule", { value: true });
var zip_1 = require("./zip");
exports.PenumbraZipWriter = zip_1.PenumbraZipWriter;
/** Penumbra user agent support level */
var PenumbraSupportLevel;
(function (PenumbraSupportLevel) {
    /** Old browser where Penumbra does not work at all */
    PenumbraSupportLevel[PenumbraSupportLevel["none"] = 0] = "none";
    /** Modern browser where Penumbra is not yet supported */
    PenumbraSupportLevel[PenumbraSupportLevel["possible"] = 0] = "possible";
    /** Modern browser where file size limit is low */
    PenumbraSupportLevel[PenumbraSupportLevel["size_limited"] = 1] = "size_limited";
    /** Modern browser with full support */
    PenumbraSupportLevel[PenumbraSupportLevel["full"] = 2] = "full";
})(PenumbraSupportLevel = exports.PenumbraSupportLevel || (exports.PenumbraSupportLevel = {}));
//# sourceMappingURL=types.js.map