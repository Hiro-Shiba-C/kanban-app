"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssueSeverity = exports.IssueType = exports.DependencyType = exports.FileType = void 0;
// ファイルタイプ
var FileType;
(function (FileType) {
    FileType["TYPESCRIPT"] = "typescript";
    FileType["JAVASCRIPT"] = "javascript";
    FileType["REACT_COMPONENT"] = "react-component";
    FileType["NEXT_PAGE"] = "next-page";
    FileType["NEXT_LAYOUT"] = "next-layout";
    FileType["CONFIG"] = "config";
    FileType["TEST"] = "test";
    FileType["STYLE"] = "style";
    FileType["MARKDOWN"] = "markdown";
    FileType["JSON"] = "json";
    FileType["OTHER"] = "other";
})(FileType || (exports.FileType = FileType = {}));
var DependencyType;
(function (DependencyType) {
    DependencyType["INTERNAL"] = "internal";
    DependencyType["EXTERNAL"] = "external";
    DependencyType["RELATIVE"] = "relative";
})(DependencyType || (exports.DependencyType = DependencyType = {}));
var IssueType;
(function (IssueType) {
    IssueType["CIRCULAR_DEPENDENCY"] = "circular-dependency";
    IssueType["UNUSED_IMPORT"] = "unused-import";
    IssueType["MISSING_TYPES"] = "missing-types";
    IssueType["LARGE_FILE"] = "large-file";
    IssueType["COMPLEX_COMPONENT"] = "complex-component";
    IssueType["NO_TESTS"] = "no-tests";
})(IssueType || (exports.IssueType = IssueType = {}));
var IssueSeverity;
(function (IssueSeverity) {
    IssueSeverity["ERROR"] = "error";
    IssueSeverity["WARNING"] = "warning";
    IssueSeverity["INFO"] = "info";
})(IssueSeverity || (exports.IssueSeverity = IssueSeverity = {}));
//# sourceMappingURL=analysis-types.js.map