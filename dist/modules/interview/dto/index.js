"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RequestInterviewDto", {
    enumerable: true,
    get: function() {
        return _requestinterviewdto.RequestInterviewDto;
    }
});
_export_star(require("./confirm-interview.dto"), exports);
const _requestinterviewdto = require("./request-interview.dto");
_export_star(require("./schedule-interview.dto"), exports);
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