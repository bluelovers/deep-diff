export declare const enum EnumKinds {
    /**
     * Item was edited
     */
    DiffEdit = "E",
    /**
     * Item is new
     */
    DiffNew = "N",
    /**
     * Item was edited
     */
    DiffDeleted = "D",
    /**
     * Array was modified
     */
    DiffArray = "A"
}
export declare type IPathKey = string | number | symbol;
export declare type IPaths = IPathKey[];
export declare type IDiffNode<LHS = unknown, RHS = LHS> = DiffNew<RHS> | DiffDeleted<LHS> | DiffEdit<LHS, RHS> | DiffArray<LHS, RHS>;
export declare type Observer<LHS, RHS = LHS> = (diff: IDiffNode<LHS, RHS>) => void;
export declare type PreFilterFunction = (path: any[], key: any) => boolean;
export interface PreFilterObject<LHS, RHS = LHS> {
    prefilter?(path: any[], key: any): boolean;
    normalize?(currentPath: any, key: any, lhs: LHS, rhs: RHS): [LHS, RHS] | undefined;
}
export declare type PreFilter<LHS, RHS = LHS> = PreFilterFunction | PreFilterObject<LHS, RHS>;
export declare type Filter<LHS, RHS = LHS> = (target: LHS, source: RHS, change: IDiffNode<LHS, RHS>) => boolean;
export declare abstract class Diff {
    kind: EnumKinds;
    path: IPaths;
    protected constructor(kind: EnumKinds, path?: IPaths);
}
/**
 * Item was edited
 */
export declare class DiffEdit<LHS, RHS = LHS> extends Diff {
    lhs: LHS;
    rhs: RHS;
    kind: EnumKinds.DiffEdit;
    constructor(path: IPaths, lhs: LHS, rhs: RHS);
}
/**
 * Item is new
 */
export declare class DiffNew<RHS> extends Diff {
    rhs: RHS;
    kind: EnumKinds.DiffNew;
    constructor(path: IPaths, rhs: RHS);
}
/**
 * Item was edited
 */
export declare class DiffDeleted<LHS> extends Diff {
    lhs: LHS;
    kind: EnumKinds.DiffDeleted;
    constructor(path: IPaths, lhs: LHS);
}
/**
 * Array was modified
 */
export declare class DiffArray<LHS, RHS = LHS> extends Diff {
    index: number;
    item: IDiffNode<LHS, RHS>;
    kind: EnumKinds.DiffArray;
    constructor(path: IPaths, index: number, item: IDiffNode<LHS, RHS>);
}
/**
 * Gets a hash of the given object in an array order-independent fashion
 * also object key order independent (easier since they can be alphabetized)
 */
export declare function getOrderIndependentHash(object: unknown): number;
export declare function observableDiff<LHS, RHS = LHS>(lhs: LHS, rhs: RHS, observer?: Observer<LHS, RHS>, prefilter?: PreFilter<LHS, RHS>, orderIndependent?: boolean): IDiffNode<LHS, RHS>[];
export declare function orderIndependentObservableDiff(lhs: any, rhs: any, changes: any, prefilter: any, path: any, key: any, stack: any): void;
export declare function deepDiff<LHS, RHS = LHS>(lhs: LHS, rhs: RHS, prefilter?: PreFilter<LHS, RHS>, accum?: IDiffNode<LHS, RHS>[]): IDiffNode<LHS, RHS>[];
export declare function orderIndependentDiff<LHS, RHS = LHS>(lhs: LHS, rhs: RHS, prefilter?: PreFilter<LHS, RHS>, accum?: IDiffNode<LHS, RHS>[]): IDiffNode<LHS, RHS>[];
export declare function isIDiffNode<T extends IDiffNode>(source?: unknown): source is T;
export declare function applyChange<LHS>(target: LHS, source: any, change?: IDiffNode<LHS, any>): void;
export declare function revertChange<LHS>(target: LHS, source: any, change: IDiffNode): void;
export declare function applyDiff<LHS, RHS = LHS>(target: LHS, source: RHS, filter?: Filter<LHS, RHS>): LHS;
export declare function applyDiffChange<RHS>(lhs: unknown, differences: IDiffNode<any, RHS>[]): RHS;
export declare function revertDiffChange<LHS>(lhs: unknown, differences: IDiffNode<LHS, any>[]): LHS;
export { deepDiff as diff };
export default deepDiff;
