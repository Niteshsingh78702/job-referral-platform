"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
_export_star(require("./otp.service"), exports);
_export_star(require("./token.service"), exports);
_export_star(require("./auth.service"), exports);
_export_star(require("./google-auth.service"), exports);
function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}

//# sourceMappingURL=index.js.map