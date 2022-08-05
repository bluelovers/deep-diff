// @ts-nocheck

import * as deep from '../src/';
import { getOrderIndependentHash } from '../src/';
import { IDiffNode } from '../src/index';

describe('deep-diff', () =>
{
	let empty = {};

	describe('A target that has no properties', () =>
	{

		it(
			'shows no differences when compared to another empty object',
			() =>
			{
				expect(typeof deep.diff(empty, {})).toStrictEqual('undefined');
			},
		);

		describe('when compared to a different type of keyless object', () =>
		{
			var comparandTuples = [
				[
					'an array', {
					key: [],
				},
				],
				[
					'an object', {
					key: {},
				},
				],
				[
					'a date', {
					key: new Date('2021-06-07T18:11:55.233Z'),
				},
				],
				[
					'a null', {
					key: null,
				},
				],
				[
					'a regexp literal', {
					key: /a/,
				},
				],
				[
					'Math', {
					key: Math,
				},
				],
			];

			comparandTuples.forEach(function (lhsTuple)
			{
				comparandTuples.forEach(function (rhsTuple)
				{
					if (lhsTuple[0] === rhsTuple[0])
					{
						return;
					}
					it(
						'shows differences when comparing ' + lhsTuple[0] + ' to ' + rhsTuple[0],
						() =>
						{
							const diff = deep.diff(lhsTuple[1], rhsTuple[1]);
							expect(diff).toBeTruthy();
							expect(diff.length).toStrictEqual(1);
							expect(diff[0]).toHaveProperty('kind');
							expect(diff[0].kind).toStrictEqual('E');

							expect(diff).toMatchSnapshot();
						},
					);
				});
			});
		});

		describe('when compared with an object having other properties', () =>
		{
			const comparand = {
				other: 'property',
				another: 13.13,
			};
			const diff = deep.diff(empty, comparand);

			it('the differences are reported', () =>
			{
				expect(diff).toBeTruthy();
				expect(diff.length).toStrictEqual(2);

				expect(diff[0]).toHaveProperty('kind');
				expect(diff[0].kind).toStrictEqual('N');
				expect(diff[0]).toHaveProperty('path');
				expect(diff[0].path).toBeInstanceOf(Array);
				expect(diff[0].path[0]).toEqual('other');
				expect(diff[0]).toHaveProperty('rhs');
				expect(diff[0].rhs).toStrictEqual('property');

				expect(diff[1]).toHaveProperty('kind');
				expect(diff[1].kind).toStrictEqual('N');
				expect(diff[1]).toHaveProperty('path');
				expect(diff[1].path).toBeInstanceOf(Array);
				expect(diff[1].path[0]).toEqual('another');
				expect(diff[1]).toHaveProperty('rhs');
				expect(diff[1].rhs).toStrictEqual(13.13);

				expect(diff).toMatchSnapshot();
			});

		});

	});

	describe('A target that has one property', () =>
	{
		const lhs = {
			one: 'property',
		};

		it('shows no differences when compared to itself', () =>
		{
			expect(typeof deep.diff(lhs, lhs)).toStrictEqual('undefined');
		});

		it(
			'shows the property as removed when compared to an empty object',
			() =>
			{
				const diff = deep.diff(lhs, empty);
				expect(diff).toBeTruthy();
				expect(diff.length).toStrictEqual(1);
				expect(diff[0]).toHaveProperty('kind');
				expect(diff[0].kind).toStrictEqual('D');

				expect(diff).toMatchSnapshot();
			},
		);

		it(
			'shows the property as edited when compared to an object with null',
			() =>
			{
				const diff = deep.diff(lhs, {
					one: null,
				});
				expect(diff).toBeTruthy();
				expect(diff.length).toStrictEqual(1);
				expect(diff[0]).toHaveProperty('kind');
				expect(diff[0].kind).toStrictEqual('E');

				expect(diff).toMatchSnapshot();
			},
		);

		it('shows the property as edited when compared to an array', () =>
		{
			const diff = deep.diff(lhs, ['one']);
			expect(diff).toBeTruthy();
			expect(diff.length).toStrictEqual(1);
			expect(diff[0]).toHaveProperty('kind');
			expect(diff[0].kind).toStrictEqual('E');

			expect(diff).toMatchSnapshot();
		});

	});

	describe('A target that has null value', () =>
	{
		const lhs = {
			key: null,
		};

		it('shows no differences when compared to itself', () =>
		{
			expect(typeof deep.diff(lhs, lhs)).toStrictEqual('undefined');
		});

		it(
			'shows the property as removed when compared to an empty object',
			() =>
			{
				const diff = deep.diff(lhs, empty);
				expect(diff).toBeTruthy();
				expect(diff.length).toStrictEqual(1);
				expect(diff[0]).toHaveProperty('kind');
				expect(diff[0].kind).toStrictEqual('D');

				expect(diff).toMatchSnapshot();
			},
		);

		it(
			'shows the property is changed when compared to an object that has value',
			() =>
			{
				const diff = deep.diff(lhs, {
					key: 'value',
				});
				expect(diff).toBeTruthy();
				expect(diff.length).toStrictEqual(1);
				expect(diff[0]).toHaveProperty('kind');
				expect(diff[0].kind).toStrictEqual('E');

				expect(diff).toMatchSnapshot();
			},
		);

		it(
			'shows that an object property is changed when it is set to null',
			() =>
			{
				lhs.key = {
					nested: 'value',
				};
				const diff = deep.diff(lhs, {
					key: null,
				});
				expect(diff).toBeTruthy();
				expect(diff.length).toStrictEqual(1);
				expect(diff[0]).toHaveProperty('kind');
				expect(diff[0].kind).toStrictEqual('E');

				expect(diff).toMatchSnapshot();
			},
		);

	});

	describe('A target that has a date value', () =>
	{
		const lhs = {
			key: new Date(555555555555),
		};

		it('shows the property is changed with a new date value', () =>
		{
			const diff = deep.diff(lhs, {
				key: new Date(777777777777),
			});
			expect(diff).toBeTruthy();
			expect(diff.length).toStrictEqual(1);
			expect(diff[0]).toHaveProperty('kind');
			expect(diff[0].kind).toStrictEqual('E');

			expect(diff).toMatchSnapshot();
		});

	});

	describe('A target that has a NaN', () =>
	{
		var lhs = {
			key: NaN,
		};

		it(
			'shows the property is changed when compared to another number',
			() =>
			{
				const diff = deep.diff(lhs, {
					key: 0,
				});
				expect(diff).toBeTruthy();
				expect(diff.length).toStrictEqual(1);
				expect(diff[0]).toHaveProperty('kind');
				expect(diff[0].kind).toStrictEqual('E');

				expect(diff).toMatchSnapshot();
			},
		);

		it('shows no differences when compared to another NaN', () =>
		{
			const diff = deep.diff(lhs, {
				key: NaN,
			});
			expect(typeof diff).toStrictEqual('undefined');
		});

	});

	describe.skip('can revert namespace using noConflict', () =>
	{
		if (deep.noConflict)
		{
			deep = deep.noConflict();

			it('conflict is restored (when applicable)', () =>
			{
				// In node there is no global conflict.
				if (typeof globalConflict !== 'undefined')
				{
					expect(DeepDiff).toStrictEqual(deep);
				}
			});

			it(
				'DeepDiff functionality available through result of noConflict()',
				() =>
				{
					expect(typeof deep.applyDiff).toStrictEqual('function');
				},
			);
		}
	});

	describe('When filtering keys', () =>
	{
		const lhs = {
			enhancement: 'Filter/Ignore Keys?',
			numero: 11,
			submittedBy: 'ericclemmons',
			supportedBy: ['ericclemmons'],
			status: 'open',
		};
		const rhs = {
			enhancement: 'Filter/Ignore Keys?',
			numero: 11,
			submittedBy: 'ericclemmons',
			supportedBy: [
				'ericclemmons',
				'TylerGarlick',
				'flitbit',
				'ergdev',
			],
			status: 'closed',
			fixedBy: 'flitbit',
		};

		describe('if the filtered property is an array', () =>
		{

			it('changes to the array do not appear as a difference', () =>
			{
				const prefilter = function (path, key)
				{
					return key === 'supportedBy';
				};
				const diff = deep.diff(lhs, rhs, prefilter);
				expect(diff).toBeTruthy();
				expect(diff.length).toStrictEqual(2);
				expect(diff[0]).toHaveProperty('kind');
				expect(diff[0].kind).toStrictEqual('E');
				expect(diff[1]).toHaveProperty('kind');
				expect(diff[1].kind).toStrictEqual('N');

				expect(diff).toMatchSnapshot();
			});

		});

		describe('if the filtered config is passed as an object', () =>
		{

			it('changes to the array to not appear as a difference', () =>
			{
				const prefilter = function (path, key)
				{
					return key === 'supportedBy';
				};
				var diff = deep.diff(lhs, rhs, { prefilter: prefilter });
				expect(diff).toBeTruthy();
				expect(diff.length).toStrictEqual(2);
				expect(diff[0]).toHaveProperty('kind');
				expect(diff[0].kind).toStrictEqual('E');
				expect(diff[1]).toHaveProperty('kind');
				expect(diff[1].kind).toStrictEqual('N');

				expect(diff).toMatchSnapshot();
			});

		});

		describe('if the filtered property is not an array', () =>
		{

			it('changes do not appear as a difference', () =>
			{
				const prefilter = function (path, key)
				{
					return key === 'fixedBy';
				};
				const diff = deep.diff(lhs, rhs, prefilter);
				expect(diff).toBeTruthy();
				expect(diff.length).toStrictEqual(4);
				expect(diff[0]).toHaveProperty('kind');
				expect(diff[0].kind).toStrictEqual('A');
				expect(diff[1]).toHaveProperty('kind');
				expect(diff[1].kind).toStrictEqual('A');
				expect(diff[2]).toHaveProperty('kind');
				expect(diff[2].kind).toStrictEqual('A');
				expect(diff[3]).toHaveProperty('kind');
				expect(diff[3].kind).toStrictEqual('E');

				expect(diff).toMatchSnapshot();
			});

		});
	});

	describe('Can normalize properties to before diffing', () =>
	{
		const testLHS = {
			array: [1, 2, 3, 4, 5],
		};

		const testRHS = {
			array: '1/2/3/4/5',
		};

		it('changes do not appear as a difference', () =>
		{
			const filter = {
				normalize: function (path, key, lhs, rhs)
				{
					expect(key).toStrictEqual('array');

					if (Array.isArray(lhs))
					{
						lhs = lhs.join('/');
					}
					if (Array.isArray(rhs))
					{
						rhs = rhs.join('/');
					}
					return [lhs, rhs];
				},
			};

			let diff;

			diff = deep.diff(testLHS, testRHS, filter);
			expect(typeof diff).toStrictEqual('undefined');

			diff = deep.diff(testRHS, testLHS, filter);
			expect(typeof diff).toStrictEqual('undefined');
		});

		it('falsy return does not normalize', () =>
		{
			const filter = {
				// eslint-disable-next-line no-unused-vars
				normalize: function (path, key, lhs, rhs)
				{
					return false;
				},
			};

			let diff: IDiffNode[];

			diff = deep.diff(testLHS, testRHS, filter);
			expect(diff).toBeTruthy();

			expect(diff).toMatchSnapshot();

			diff = deep.diff(testRHS, testLHS, filter);
			expect(diff).toBeTruthy();

			expect(diff).toMatchSnapshot();
		});
	});

	describe('A target that has nested values', () =>
	{
		const nestedOne = {
			noChange: 'same',
			levelOne: {
				levelTwo: 'value',
			},
			arrayOne: [
				{
					objValue: 'value',
				},
			],
		};
		const nestedTwo = {
			noChange: 'same',
			levelOne: {
				levelTwo: 'another value',
			},
			arrayOne: [
				{
					objValue: 'new value',
				}, {
					objValue: 'more value',
				},
			],
		};

		it('shows no differences when compared to itself', () =>
		{
			expect(typeof deep.diff(nestedOne, nestedOne)).toStrictEqual('undefined');
		});

		it(
			'shows the property as removed when compared to an empty object',
			() =>
			{
				const diff = deep.diff(nestedOne, empty);
				expect(diff).toBeTruthy();
				expect(diff.length).toStrictEqual(3);
				expect(diff[0]).toHaveProperty('kind');
				expect(diff[0].kind).toStrictEqual('D');
				expect(diff[1]).toHaveProperty('kind');
				expect(diff[1].kind).toStrictEqual('D');

				expect(diff).toMatchSnapshot();
			},
		);

		it(
			'shows the property is changed when compared to an object that has value',
			() =>
			{
				const diff = deep.diff(nestedOne, nestedTwo);
				expect(diff).toBeTruthy();
				expect(diff.length).toStrictEqual(3);

				expect(diff).toMatchSnapshot();
			},
		);

		it(
			'shows the property as added when compared to an empty object on left',
			() =>
			{
				const diff = deep.diff(empty, nestedOne);
				expect(diff).toBeTruthy();
				expect(diff.length).toStrictEqual(3);
				expect(diff[0]).toHaveProperty('kind');
				expect(diff[0].kind).toStrictEqual('N');

				expect(diff).toMatchSnapshot();
			},
		);

		describe('when diff is applied to a different empty object', () =>
		{
			const diff = deep.diff(nestedOne, nestedTwo);

			it('has result with nested values', () =>
			{
				const result = {};

				deep.applyChange(result, nestedTwo, diff[0]);
				expect(result.levelOne).toBeTruthy();
				expect(typeof result.levelOne).toStrictEqual('object');
				expect(result.levelOne.levelTwo).toBeTruthy();
				expect(result.levelOne.levelTwo).toEqual('another value');

				expect({
					result,
					nestedTwo,
				}).toMatchSnapshot();
			});

			it('has result with array object values', () =>
			{
				const result = {};

				deep.applyChange(result, nestedTwo, diff[2]);
				expect(result.arrayOne).toBeTruthy();
				expect(result.arrayOne).toBeInstanceOf(Array);
				expect(result.arrayOne[0]).toBeTruthy();
				expect(result.arrayOne[0].objValue).toBeTruthy();
				expect(result.arrayOne[0].objValue).toStrictEqual('new value');

				expect({
					result,
					nestedTwo,
				}).toMatchSnapshot();
			});

			it('has result with added array objects', () =>
			{
				var result = {};

				deep.applyChange(result, nestedTwo, diff[1]);
				expect(result.arrayOne).toBeTruthy();
				expect(result.arrayOne).toBeInstanceOf(Array);
				expect(result.arrayOne[1]).toBeTruthy();
				expect(result.arrayOne[1].objValue).toBeTruthy();
				expect(result.arrayOne[1].objValue).toStrictEqual('more value');

				expect({
					result,
					nestedTwo,
				}).toMatchSnapshot();
			});
		});
	});

	describe('regression test for bug #10, ', () =>
	{
		const lhs = {
			id: 'Release',
			phases: [
				{
					id: 'Phase1',
					tasks: [
						{
							id: 'Task1',
						}, {
							id: 'Task2',
						},
					],
				}, {
					id: 'Phase2',
					tasks: [
						{
							id: 'Task3',
						},
					],
				},
			],
		};
		const rhs = {
			id: 'Release',
			phases: [
				{
					// E: Phase1 -> Phase2
					id: 'Phase2',
					tasks: [
						{
							id: 'Task3',
						},
					],
				}, {
					id: 'Phase1',
					tasks: [
						{
							id: 'Task1',
						}, {
							id: 'Task2',
						},
					],
				},
			],
		};

		describe('differences in nested arrays are detected', () =>
		{
			const diff = deep.diff(lhs, rhs);

			expect(diff).toBeTruthy();
			expect(diff.length).toStrictEqual(6);

			expect(diff).toMatchSnapshot();

			describe('differences can be applied', () =>
			{
				const applied = deep.applyDiff(lhs, rhs);

				it('and the result equals the rhs', () =>
				{
					expect(applied).toEqual(rhs);
					expect(applied).toMatchSnapshot();
				});

			});
		});

	});

	describe('regression test for bug #35', () =>
	{
		const lhs = ['a', 'a', 'a'];
		const rhs = ['a'];

		it('can apply diffs between two top level arrays', () =>
		{
			const differences = deep.diff(lhs, rhs);

			differences.forEach(function (it)
			{
				deep.applyChange(lhs, true, it);
			});

			expect(lhs).toEqual(['a']);

			expect(differences).toMatchSnapshot();
		});
	});

	describe.skip('Objects from different frames', () =>
	{
		if (typeof globalConflict === 'undefined')
		{ return; }

		// eslint-disable-next-line no-undef
		var frame = document.createElement('iframe');
		// eslint-disable-next-line no-undef
		document.body.appendChild(frame);

		var lhs = new frame.contentWindow.Date(2010, 1, 1);
		var rhs = new frame.contentWindow.Date(2010, 1, 1);

		it('can compare date instances from a different frame', () =>
		{
			var differences = deep.diff(lhs, rhs);

			expect(differences).toStrictEqual(undefined);
		});
	});

	describe('Comparing regexes should work', () =>
	{
		var lhs = /foo/;
		var rhs = /foo/i;

		it('can compare regex instances', () =>
		{
			var diff = deep.diff(lhs, rhs);

			expect(diff.length).toStrictEqual(1);

			expect(diff[0].kind).toStrictEqual('E');
			expect(diff[0].path).toBeFalsy();
			expect(diff[0].lhs).toStrictEqual('/foo/');
			expect(diff[0].rhs).toStrictEqual('/foo/i');

			expect(diff).toMatchSnapshot();
		});
	});

	describe('subject.toString is not a function', () =>
	{
		var lhs = {
			left: 'yes',
			right: 'no',
		};
		var rhs = {
			left: {
				toString: true,
			},
			right: 'no',
		};

		it('should not throw a TypeError', () =>
		{
			var diff = deep.diff(lhs, rhs);

			expect(diff.length).toStrictEqual(1);

			expect(diff).toMatchSnapshot();
		});
	});

	describe('regression test for issue #83', () =>
	{
		const lhs = {
			date: null,
		};
		const rhs = {
			date: null,
		};

		it('should not detect a difference', () =>
		{
			expect(deep.diff(lhs, rhs)).toStrictEqual(undefined);
		});
	});

	describe('regression test for issue #70', () =>
	{

		it('should detect a difference with undefined property on lhs', () =>
		{
			var diff = deep.diff({ foo: undefined }, {});

			expect(diff).toBeInstanceOf(Array);
			expect(diff.length).toStrictEqual(1);

			expect(diff[0].kind).toStrictEqual('D');
			expect(diff[0].path).toBeInstanceOf(Array);
			expect(diff[0].path).toHaveLength(1);
			expect(diff[0].path[0]).toStrictEqual('foo');
			expect(diff[0].lhs).toStrictEqual(undefined);

			expect(diff).toMatchSnapshot();

		});

		it('should detect a difference with undefined property on rhs', () =>
		{
			var diff = deep.diff({}, { foo: undefined });

			expect(diff).toBeInstanceOf(Array);
			expect(diff.length).toStrictEqual(1);

			expect(diff[0].kind).toStrictEqual('N');
			expect(diff[0].path).toBeInstanceOf(Array);
			expect(diff[0].path).toHaveLength(1);
			expect(diff[0].path[0]).toStrictEqual('foo');
			expect(diff[0].rhs).toStrictEqual(undefined);

			expect(diff).toMatchSnapshot();

		});
	});

	describe('regression test for issue #98', () =>
	{
		var lhs = { foo: undefined };
		var rhs = { foo: undefined };

		it(
			'should not detect a difference with two undefined property values',
			() =>
			{
				var diff = deep.diff(lhs, rhs);

				expect(diff).toStrictEqual(undefined);

			},
		);
	});

	describe('regression tests for issue #102', () =>
	{
		it('should not throw a TypeError', () =>
		{

			var diff = deep.diff(null, undefined);

			expect(diff).toBeInstanceOf(Array);
			expect(diff.length).toStrictEqual(1);

			expect(diff[0].kind).toStrictEqual('D');
			expect(diff[0].lhs).toStrictEqual(null);

			expect(diff).toMatchSnapshot();

		});

		it('should not throw a TypeError', () =>
		{

			var diff = deep.diff(Object.create(null), { foo: undefined });

			expect(diff).toBeInstanceOf(Array);
			expect(diff.length).toStrictEqual(1);

			expect(diff[0].kind).toStrictEqual('N');
			expect(diff[0].rhs).toStrictEqual(undefined);

			expect(diff).toMatchSnapshot();
		});
	});

	describe('Order independent hash testing', () =>
	{
		function sameHash(a: any, b: any)
		{
			const hash = getOrderIndependentHash(a);
			expect(hash).toStrictEqual(getOrderIndependentHash(b));

			expect({
				a,
				hash,
			}).toMatchSnapshot();
		}

		function differentHash(a: any, b: any)
		{
			const hash_a = getOrderIndependentHash(a);
			const hash_b = getOrderIndependentHash(b);

			expect(hash_a).not.toStrictEqual(hash_b);

			expect({
				a,
				hash_a,
				b,
				hash_b,
			}).toMatchSnapshot();
		}

		describe('Order indepdendent hash function should give different values for different objects', () =>
		{
			it('should give different values for different "simple" types', () =>
			{
				differentHash(1, -20);
				differentHash('foo', 45);
				differentHash('pie', 'something else');
				differentHash(1.3332, 1);
				differentHash(1, null);
				differentHash('this is kind of a long string, don\'t you think?', 'the quick brown fox jumped over the lazy doge');
				differentHash(true, 2);
				differentHash(false, 'flooog');
			});

			it(
				'should give different values for string and object with string',
				() =>
				{
					differentHash('some string', { key: 'some string' });
				},
			);

			it('should give different values for number and array', () =>
			{
				differentHash(1, [1]);
			});

			it(
				'should give different values for string and array of string',
				() =>
				{
					differentHash('string', ['string']);
				},
			);

			it(
				'should give different values for boolean and object with boolean',
				() =>
				{
					differentHash(true, { key: true });
				},
			);

			it('should give different values for different arrays', () =>
			{
				differentHash([1, 2, 3], [1, 2]);
				differentHash([1, 4, 5, 6], ['foo', 1, true, undefined]);
				differentHash([1, 4, 6], [1, 4, 7]);
				differentHash([1, 3, 5], ['1', '3', '5']);
			});

			it('should give different values for different objects', () =>
			{
				differentHash({ key: 'value' }, { other: 'value' });
				differentHash({ a: { b: 'c' } }, { a: 'b' });
			});

			it('should differentiate between arrays and objects', () =>
			{
				differentHash([1, true, '1'], { a: 1, b: true, c: '1' });
			});
		});

		describe('Order independent hash function should work in pathological cases', () =>
		{
			it('should work in funky javascript cases', () =>
			{
				differentHash(undefined, null);
				differentHash(0, undefined);
				differentHash(0, null);
				differentHash(0, false);
				differentHash(0, []);
				differentHash('', []);
				differentHash(3.22, '3.22');
				differentHash(true, 'true');
				differentHash(false, 0);
			});

			it('should work on empty array and object', () =>
			{
				differentHash([], {});
			});

			it('should work on empty object and undefined', () =>
			{
				differentHash({}, undefined);
			});

			it('should work on empty array and array with 0', () =>
			{
				differentHash([], [0]);
			});
		});

		describe('Order independent hash function should be order independent', () =>
		{
			it('should not care about array order', () =>
			{
				sameHash([1, 2, 3], [3, 2, 1]);
				sameHash(['hi', true, 9.4], [true, 'hi', 9.4]);
			});

			it('should not care about key order in an object', () =>
			{
				sameHash({ foo: 'bar', foz: 'baz' }, { foz: 'baz', foo: 'bar' });
			});

			it('should work with complicated objects', () =>
			{
				var obj1 = {
					foo: 'bar',
					faz: [
						1,
						'pie',
						{
							food: 'yum',
						},
					],
				};

				var obj2 = {
					faz: [
						'pie',
						{
							food: 'yum',
						},
						1,
					],
					foo: 'bar',
				};

				sameHash(obj1, obj2);
			});
		});
	});

	describe('Order indepedent array comparison should work', () =>
	{
		it('can compare simple arrays in an order independent fashion', () =>
		{
			var lhs = [1, 2, 3];
			var rhs = [1, 3, 2];

			var diff = deep.orderIndependentDiff(lhs, rhs);
			expect(diff).toStrictEqual(undefined);
		});

		it('still works with repeated elements', () =>
		{
			var lhs = [1, 1, 2];
			var rhs = [1, 2, 1];

			var diff = deep.orderIndependentDiff(lhs, rhs);
			expect(diff).toStrictEqual(undefined);
		});

		it('works on complex objects', () =>
		{
			var obj1 = {
				foo: 'bar',
				faz: [
					1,
					'pie',
					{
						food: 'yum',
					},
				],
			};

			var obj2 = {
				faz: [
					'pie',
					{
						food: 'yum',
					},
					1,
				],
				foo: 'bar',
			};

			var diff = deep.orderIndependentDiff(obj1, obj2);
			expect(diff).toStrictEqual(undefined);
		});

		it('should report some difference in non-equal arrays', () =>
		{
			var lhs = [1, 2, 3];
			var rhs = [2, 2, 3];

			var diff = deep.orderIndependentDiff(lhs, rhs);
			expect(diff.length).toBeTruthy();
		});

	});

});

describe('Diff-ing symbol-based keys should work', () =>
{
	const lhs = {
		[Symbol.iterator]: 'Iterator', // eslint-disable-line no-undef
		foo: 'bar',
	};
	const rhs = {
		foo: 'baz',
	};

	const res = deep.diff(lhs, rhs);
	expect(res).toBeTruthy();
	expect(res).toBeInstanceOf(Array);
	expect(res).toHaveLength(2);

	let changed = 0, deleted = 0;
	for (const difference of res)
	{
		if (difference.kind === 'D')
		{
			deleted += 1;
		}
		else if (difference.kind === 'E')
		{
			changed += 1;
		}
	}

	expect(changed).toStrictEqual(1);
	expect(deleted).toStrictEqual(1);

	expect(res).toMatchSnapshot();

});
