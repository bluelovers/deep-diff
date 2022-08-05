// @ts-nocheck

export const enum EnumKinds
{
	/**
	 * Item was edited
	 */
	DiffEdit = 'E',
	/**
	 * Item is new
	 */
	DiffNew = 'N',
	/**
	 * Item was edited
	 */
	DiffDeleted = 'D',
	/**
	 * Array was modified
	 */
	DiffArray = 'A',
}

const validKinds = [EnumKinds.DiffNew, EnumKinds.DiffEdit, EnumKinds.DiffArray, EnumKinds.DiffDeleted] as const;

export type IPathKey = string | number | symbol;
export type IPaths = IPathKey[];

export type IDiffNode<LHS = unknown, RHS = LHS> = DiffNew<RHS> | DiffDeleted<LHS> | DiffEdit<LHS, RHS> | DiffArray<LHS, RHS>;

export type Observer<LHS, RHS = LHS> = (diff: IDiffNode<LHS, RHS>) => void;

export type PreFilterFunction = (path: any[], key: any) => boolean;
export interface PreFilterObject<LHS, RHS = LHS> {
	prefilter?(path: any[], key: any): boolean;
	normalize?(currentPath: any, key: any, lhs: LHS, rhs: RHS): [ LHS, RHS ] | undefined;
}

export type PreFilter<LHS, RHS = LHS> = PreFilterFunction | PreFilterObject<LHS, RHS>;

export type Filter<LHS, RHS = LHS> = (target: LHS, source: RHS, change: IDiffNode<LHS, RHS>) => boolean;

export abstract class Diff
{
	public path: IPaths;

	protected constructor(public kind: EnumKinds, path?: IPaths)
	{
		if (path?.length)
		{
			this.path = path
		}
	}
}

/**
 * Item was edited
 */
export class DiffEdit<LHS, RHS = LHS> extends Diff
{
	public override kind: EnumKinds.DiffEdit;

	constructor(path: IPaths, public lhs: LHS, public rhs: RHS)
	{
		super(EnumKinds.DiffEdit, path);
	}
}

/**
 * Item is new
 */
export class DiffNew<RHS> extends Diff
{
	public override kind: EnumKinds.DiffNew;

	constructor(path: IPaths, public rhs: RHS)
	{
		super(EnumKinds.DiffNew, path);
	}
}

/**
 * Item was edited
 */
export class DiffDeleted<LHS> extends Diff
{
	public override kind: EnumKinds.DiffDeleted;

	constructor(path: IPaths, public lhs: LHS)
	{
		super(EnumKinds.DiffDeleted, path);
	}
}

/**
 * Array was modified
 */
export class DiffArray<LHS, RHS = LHS> extends Diff
{
	public override kind: EnumKinds.DiffArray;

	constructor(path: IPaths, public index: number, public item: IDiffNode<LHS, RHS>)
	{
		super(EnumKinds.DiffArray, path);
	}
}

function arrayRemove<T extends any[]>(arr: T, from: number)
{
	return arr.splice(from, 1);

//	const rest = arr.slice((to || from) + 1 || arr.length);
//	arr.length = from < 0 ? arr.length + from : from;
//	arr.push.apply(arr, rest);
//	return arr;
}

function realTypeOf(subject: unknown)
{
	const type = typeof subject;
	if (type !== 'object')
	{
		return type;
	}

	if (subject === Math)
	{
		return 'math';
	}
	else if (subject === null)
	{
		return 'null';
	}
	else if (Array.isArray(subject))
	{
		return 'array';
	}
	else if (Object.prototype.toString.call(subject) === '[object Date]')
	{
		return 'date';
	}
	else if (typeof subject.toString === 'function' && /^\/.*\//.test(subject.toString()))
	{
		return 'regexp';
	}
	return 'object';
}

/**
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
function hashThisString(string: string)
{
	let hash = 0;
	if (string.length === 0)
	{ return hash; }
	for (let i = 0; i < string.length; i++)
	{
		const char = string.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

/**
 * Gets a hash of the given object in an array order-independent fashion
 * also object key order independent (easier since they can be alphabetized)
 */
export function getOrderIndependentHash(object: unknown)
{
	let accum = 0;
	const type = realTypeOf(object);

	if (type === 'array')
	{
		object.forEach(function (item)
		{
			// Addition is commutative so this is order indep
			accum += getOrderIndependentHash(item);
		});

		const arrayString = normalizeHashDesc(type, {
			hash: accum,
		})

		return accum + hashThisString(arrayString);
	}
	else if (type === 'object')
	{
		for (const key in object)
		{
			if (object.hasOwnProperty(key))
			{
				const keyValueString = normalizeHashDesc(type, {
					key,
					hash: getOrderIndependentHash(object[key]),
				});

				accum += hashThisString(keyValueString);
			}
		}

		return accum;
	}

	// Non object, non array...should be good?
	const stringToHash = normalizeHashDesc(type, {
		value: object,
	});

	return accum + hashThisString(stringToHash);
}

function normalizeHashDesc(type: ReturnType<typeof realTypeOf>, options: {
	value?: any,
	key?: IPathKey,
	hash?: number,
})
{
	switch (type)
	{
		case 'array':
			return `[ type: ${type} , hash: ${options.hash}]`;
		case 'object':
			return `[ type: ${type}, key: ${options.key} , hash: ${options.hash}]`;
		default:
			return `[ type: ${type} , value: ${options.value}]`;
	}
}

function _deepDiff(lhs, rhs, changes: IDiffNode[], prefilter, path: IPaths, key, stack, orderIndependent: boolean)
{
	changes = changes || [];
	path = path || [];
	stack = stack || [];
	const currentPath = path.slice(0);
	if (typeof key !== 'undefined' && key !== null)
	{
		if (prefilter)
		{
			if (typeof (prefilter) === 'function' && prefilter(currentPath, key))
			{
				return;
			}
			else if (typeof (prefilter) === 'object')
			{
				if (prefilter.prefilter && prefilter.prefilter(currentPath, key))
				{
					return;
				}
				if (prefilter.normalize)
				{
					const alt = prefilter.normalize(currentPath, key, lhs, rhs);
					if (alt)
					{
						lhs = alt[0];
						rhs = alt[1];
					}
				}
			}
		}
		currentPath.push(key);
	}

	// Use string comparison for regexes
	if (realTypeOf(lhs) === 'regexp' && realTypeOf(rhs) === 'regexp')
	{
		lhs = lhs.toString();
		rhs = rhs.toString();
	}

	const ltype = typeof lhs;
	const rtype = typeof rhs;
	let i, j, k, other;

	const ldefined = ltype !== 'undefined' ||
		(stack && (stack.length > 0) && stack[stack.length - 1].lhs &&
			Object.getOwnPropertyDescriptor(stack[stack.length - 1].lhs, key));
	const rdefined = rtype !== 'undefined' ||
		(stack && (stack.length > 0) && stack[stack.length - 1].rhs &&
			Object.getOwnPropertyDescriptor(stack[stack.length - 1].rhs, key));

	if (!ldefined && rdefined)
	{
		changes.push(new DiffNew(currentPath, rhs));
	}
	else if (!rdefined && ldefined)
	{
		changes.push(new DiffDeleted(currentPath, lhs));
	}
	else if (realTypeOf(lhs) !== realTypeOf(rhs))
	{
		changes.push(new DiffEdit(currentPath, lhs, rhs));
	}
	else if (realTypeOf(lhs) === 'date' && (lhs - rhs) !== 0)
	{
		changes.push(new DiffEdit(currentPath, lhs, rhs));
	}
	else if (ltype === 'object' && lhs !== null && rhs !== null)
	{
		for (i = stack.length - 1; i > -1; --i)
		{
			if (stack[i].lhs === lhs)
			{
				other = true;
				break;
			}
		}
		if (!other)
		{
			stack.push({ lhs: lhs, rhs: rhs });
			if (Array.isArray(lhs))
			{
				// If order doesn't matter, we need to sort our arrays
				if (orderIndependent)
				{
					lhs.sort(function (a, b)
					{
						return getOrderIndependentHash(a) - getOrderIndependentHash(b);
					});

					rhs.sort(function (a, b)
					{
						return getOrderIndependentHash(a) - getOrderIndependentHash(b);
					});
				}
				i = rhs.length - 1;
				j = lhs.length - 1;
				while (i > j)
				{
					changes.push(new DiffArray(currentPath, i, new DiffNew(undefined, rhs[i--])));
				}
				while (j > i)
				{
					changes.push(new DiffArray(currentPath, j, new DiffDeleted(undefined, lhs[j--])));
				}
				for (; i >= 0; --i)
				{
					_deepDiff(lhs[i], rhs[i], changes, prefilter, currentPath, i, stack, orderIndependent);
				}
			}
			else
			{
				const akeys = Object.keys(lhs).concat(Object.getOwnPropertySymbols(lhs));
				const pkeys = Object.keys(rhs).concat(Object.getOwnPropertySymbols(rhs));
				for (i = 0; i < akeys.length; ++i)
				{
					k = akeys[i];
					other = pkeys.indexOf(k);
					if (other >= 0)
					{
						_deepDiff(lhs[k], rhs[k], changes, prefilter, currentPath, k, stack, orderIndependent);
						pkeys[other] = null;
					}
					else
					{
						_deepDiff(lhs[k], undefined, changes, prefilter, currentPath, k, stack, orderIndependent);
					}
				}
				for (i = 0; i < pkeys.length; ++i)
				{
					k = pkeys[i];
					if (k)
					{
						_deepDiff(undefined, rhs[k], changes, prefilter, currentPath, k, stack, orderIndependent);
					}
				}
			}
			stack.length = stack.length - 1;
		}
		else if (lhs !== rhs)
		{
			// lhs is contains a cycle at this element and it differs from rhs
			changes.push(new DiffEdit(currentPath, lhs, rhs));
		}
	}
	else if (lhs !== rhs)
	{
		if (!(ltype === 'number' && isNaN(lhs) && isNaN(rhs)))
		{
			changes.push(new DiffEdit(currentPath, lhs, rhs));
		}
	}
}

export function observableDiff<LHS, RHS = LHS>(lhs: LHS, rhs: RHS, observer?: Observer<LHS, RHS>, prefilter?: PreFilter<LHS, RHS>, orderIndependent?: boolean)
{
	const changes: IDiffNode<LHS, RHS>[] = [];
	_deepDiff<LHS, RHS>(lhs, rhs, changes, prefilter, null, null, null, orderIndependent);
	if (observer)
	{
		for (let i = 0; i < changes.length; ++i)
		{
			observer(changes[i]);
		}
	}
	return changes;
}

export function orderIndependentObservableDiff(lhs, rhs, changes, prefilter, path, key, stack)
{
	return _deepDiff(lhs, rhs, changes, prefilter, path, key, stack, true);
}

export function deepDiff<LHS, RHS = LHS>(lhs: LHS, rhs: RHS, prefilter?: PreFilter<LHS, RHS>, accum?: IDiffNode<LHS, RHS>[]): IDiffNode<LHS, RHS>[]
{
	const observer = (accum) ?
		function (difference: IDiffNode)
		{
			if (difference)
			{
				accum!.push(difference);
			}
		} : undefined;
	const changes = observableDiff<LHS, RHS>(lhs, rhs, observer, prefilter);
	return (accum) ? accum : (changes.length) ? changes : undefined;
}

export function orderIndependentDiff<LHS, RHS = LHS>(lhs: LHS, rhs: RHS, prefilter?: PreFilter<LHS, RHS>, accum?: IDiffNode<LHS, RHS>[])
{
	const observer = (accum) ?
		function (difference: IDiffNode<LHS, RHS>)
		{
			if (difference)
			{
				accum!.push(difference);
			}
		} : undefined;
	const changes = observableDiff(lhs, rhs, observer, prefilter, true);
	return (accum) ? accum : (changes.length) ? changes : undefined;
}

function _traversalObject<T>(target: any, path: IPaths)
{
	path = path.slice();

	const key = path.pop();

	let it: T = target;

	path.reduce((target, key) => {
		return it = target[key]
	}, it);

	return [it, key] as const
}

function _applyArrayChange<T extends any[]>(arr: T, index: number, change: IDiffNode)
{
	if (change.path?.length)
	{
//		let it = arr[index],
//			i, u = change.path.length - 1;
//		for (i = 0; i < u; i++)
//		{
//			it = it[change.path[i]];
//		}
//
//		let key = change.path[i];

		let [it, key] = _traversalObject(arr[index], change.path);

		switch (change.kind)
		{
			case 'A':
				_applyArrayChange(it[key], change.index, change.item);
				break;
			case 'D':
				delete it[key];
				break;
			case 'E':
			case 'N':
				it[key] = change.rhs;
				break;
		}
	}
	else
	{
		switch (change.kind)
		{
			case 'A':
				_applyArrayChange(arr[index], change.index, change.item);
				break;
			case 'D':
				arr = arrayRemove(arr, index);
				break;
			case 'E':
			case 'N':
				arr[index] = change.rhs;
				break;
		}
	}
	return arr;
}

export function isIDiffNode<T extends IDiffNode>(source?: unknown): source is T
{
	return (source ?? false) && validKinds.includes(source.kind)
}

export function applyChange<LHS>(target: LHS, source: any, change?: IDiffNode<LHS, any>)
{
	if (typeof change === 'undefined' && isIDiffNode(source))
	{
		change = source;
	}
	if (target && change && change.kind)
	{
		let it = target,
			i = -1,
			last = change.path ? change.path.length - 1 : 0;
		while (++i < last)
		{
			if (typeof it[change.path[i]] === 'undefined')
			{
				it[change.path[i]] = (typeof change.path[i + 1] !== 'undefined' && typeof change.path[i + 1] === 'number')
					? []
					: {};
			}
			it = it[change.path[i]];
		}
		switch (change.kind)
		{
			case 'A':
				if (change.path && typeof it[change.path[i]] === 'undefined')
				{
					it[change.path[i]] = [];
				}
				_applyArrayChange(change.path ? it[change.path[i]] : it, change.index, change.item);
				break;
			case 'D':
				delete it[change.path[i]];
				break;
			case 'E':
			case 'N':
				it[change.path[i]] = change.rhs;
				break;
		}
	}
}

function revertArrayChange<T extends any[]>(arr: T, index: number, change: IDiffNode)
{
	if (change.path && change.path.length)
	{
		// the structure of the object at the index has changed...
		let it = arr[index],
			i, u = change.path.length - 1;
		for (i = 0; i < u; i++)
		{
			it = it[change.path[i]];
		}
		switch (change.kind)
		{
			case EnumKinds.DiffArray:
				revertArrayChange(it[change.path[i]], change.index, change.item);
				break;
			case EnumKinds.DiffDeleted:
				it[change.path[i]] = change.lhs;
				break;
			case EnumKinds.DiffEdit:
				it[change.path[i]] = change.lhs;
				break;
			case EnumKinds.DiffNew:
				delete it[change.path[i]];
				break;
		}
	}
	else
	{
		// the array item is different...
		switch (change.kind)
		{
			case EnumKinds.DiffArray:
				revertArrayChange(arr[index], change.index, change.item);
				break;
			case EnumKinds.DiffDeleted:
				arr[index] = change.lhs;
				break;
			case EnumKinds.DiffEdit:
				arr[index] = change.lhs;
				break;
			case EnumKinds.DiffNew:
				arr = arrayRemove(arr, index);
				break;
		}
	}
	return arr;
}

export function revertChange<LHS>(target: LHS, source: any, change: IDiffNode)
{
	if (target && source && change?.kind)
	{
		let it = target,
			i, u;
		u = change.path.length - 1;
		for (i = 0; i < u; i++)
		{
			if (typeof it[change.path[i]] === 'undefined')
			{
				it[change.path[i]] = {};
			}
			it = it[change.path[i]];
		}
		switch (change.kind)
		{
			case EnumKinds.DiffArray:
				// Array was modified...
				// it will be an array...
				revertArrayChange(it[change.path[i]], change.index, change.item);
				break;
			case EnumKinds.DiffDeleted:
				// Item was deleted...
				it[change.path[i]] = change.lhs;
				break;
			case EnumKinds.DiffEdit:
				// Item was edited...
				it[change.path[i]] = change.lhs;
				break;
			case EnumKinds.DiffNew:
				// Item is new...
				delete it[change.path[i]];
				break;
		}
	}
}

export function applyDiff<LHS, RHS = LHS>(target: LHS, source: RHS, filter?: Filter<LHS, RHS>)
{
	if (target && source)
	{
		const onChange = function (change: IDiffNode<LHS, RHS>)
		{
			if (!filter || filter(target, source, change))
			{
				applyChange(target, source, change);
			}
		};
		observableDiff(target, source, onChange);
	}
	return target
}

function _applyDiffChangeCore<T>(lhs: unknown, differences: IDiffNode<any, any>[], fn: (lhs: any, source: true, it: IDiffNode<any, any>) => any): lhs is T
{
	differences.forEach((it) => {
		fn(lhs, true, it);
	});

	return true;
}

export function applyDiffChange<RHS>(lhs: unknown, differences: IDiffNode<any, RHS>[]): RHS
{
	if (_applyDiffChangeCore<RHS>(lhs, differences, applyChange))
	{
		return lhs
	}
}

export function revertDiffChange<LHS>(lhs: unknown, differences: IDiffNode<LHS, any>[]): LHS
{
	if (_applyDiffChangeCore<LHS>(lhs, differences, revertChange))
	{
		return lhs
	}
}

export { deepDiff as diff }

export default deepDiff;
