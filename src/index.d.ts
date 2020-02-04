import * as React from 'react';
import {Options} from 'sass';

type FunctionComponent<P> = React.FunctionComponent<
	P & {
		id?: Null<string>,
		className?: Null<string>,
		parentStyleInfo?: StyleInfo
	}>;

export function styleComponent<P>(
	component: React.ComponentType<P>,
	processChildren?: boolean,
): FunctionComponent<Omit<P,'__StyleInfo__'>>;

export function decorateElementForStyles<P>(
	component: React.ComponentType<P>,
	processChildren?: boolean,
	elementInheritsStyle?: boolean,
): FunctionComponent<Omit<P,'__StyleInfo__'>>;

export interface StyleInfo {
	name: string;
	selector: Selector;
	parent: StyleInfo;
	children: StyleInfo[];
}

interface Selector {
	id?: string | null;
	className?: string | null;
}

interface StyleAndProps {
	style: {
		[key: string]: string | number;
	};
	props: {
		[key: string]: any;
	};
}

export function useStyle(
	name: string,
	selector: Selector,
	parent: StyleInfo,
): {
	styleInfo: StyleInfo;
	styleAndProps: StyleAndProps;
};

export function resetStyles(): void;

interface RuleSets {
	[key: string]: any;
}

export function pushRuleSets(ruleSets: RuleSets): void;

export function importScss(scss: string, sassConfig: Omit<Options, 'file' | 'data'>): void;

export function updateStyles(ruleSets: RuleSets): void;
