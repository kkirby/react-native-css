import * as React from 'react';
import fs from 'fs';
import Sass, {Options} from 'sass';

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

interface Context {
	Buffer: typeof Buffer;
	fs: typeof fs;
}

interface RuleSets {
	[key: string]: any;
}

type SassConfig = Omit<Options, 'data'> & {
	mockFileSystem?: {
		[key: string]: string;
	} | null;
	configContext?: ((ctx: Context) => void) | null;
	getSassConfig?: ((instance: typeof Sass, scss: string, sassConfig: SassConfig) => SassConfig) | null;
}

export function pushRuleSets(ruleSets: RuleSets): void;

export function renderScss(scss: string, sassConfig: SassConfig): string;

export function importScss(scss: string, sassConfig: SassConfig): void;

export function importCss(css: string): void;

export function updateStyles(ruleSets: RuleSets): void;
