import { applyDiff, applyDiffChange, diff, revertDiffChange } from '../src/index';
import { cloneDeep } from 'lodash';
import { inspect } from 'util';

describe(`lazy check`, () =>
{

	[
		[{ foo: [1, 2, 3, 5] }, { foo: [1, 2, 4, 5] }],

		[{ foo: { 1: 1, 2: 1, 3: 1, 5: 1 } }, { foo: { 1: 0, 2: 1, 4: 1, 0: 1 } }],

		[
			{
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
			}, {
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
		},
		],

	].forEach(([lhs, rhs]) =>
	{

		describe(`${inspect(lhs, null, null, false)} <-> ${inspect(rhs, null, null, false)}`, () =>
		{

			let result01 = diff(lhs, rhs);

			//console.dir(result01, { depth: null });

			beforeEach(() =>
			{
				result01 = diff(lhs, rhs)
			})

			test(`toMatchSnapshot`, () =>
			{
				let actual = result01;
				// @ts-ignore
				let expected;

				expect(actual).toMatchSnapshot();
			})

			test(`applyDiffChange`, () =>
			{
				let clone01 = cloneDeep(lhs);

				let actual = applyDiffChange(clone01, result01);
				let expected = rhs;

				//console.dir(clone01, { depth: null })

				expect(actual).toStrictEqual(clone01);
				expect(actual).toStrictEqual(expected);
				expect(actual).not.toStrictEqual(lhs);

			})

			test(`revertDiffChange`, () =>
			{
				let clone01 = cloneDeep(rhs);

				let actual = revertDiffChange(clone01, result01);
				let expected = lhs;

				//console.dir(clone01, { depth: null })

				expect(actual).toStrictEqual(clone01);
				expect(actual).toStrictEqual(expected);
				expect(actual).not.toStrictEqual(rhs);

			})

			test(`applyDiff`, () =>
			{
				let clone01 = cloneDeep(lhs);

				let actual = applyDiff(clone01, cloneDeep(rhs));
				let expected = rhs;

				//console.dir(clone01, { depth: null })

				expect(actual).toStrictEqual(clone01);
				expect(actual).toStrictEqual(expected);
				expect(actual).not.toStrictEqual(lhs);

			})

		});

	})

})
