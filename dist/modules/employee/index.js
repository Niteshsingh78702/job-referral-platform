"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get EmployeeController () {
        return _employeecontroller.EmployeeController;
    },
    get EmployeeModule () {
        return _employeemodule.EmployeeModule;
    },
    get EmployeeService () {
        return _employeeservice.EmployeeService;
    }
});
const _employeemodule = require("./employee.module");
const _employeeservice = require("./employee.service");
const _employeecontroller = require("./employee.controller");

//# sourceMappingURL=index.js.map