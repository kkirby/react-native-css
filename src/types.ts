export type StyleFunction = (context: StylePath) => false | any;

export interface StyledComponent extends React.FunctionComponent<StyleProps> {
	_isStyleized?: boolean;
}

export type Component = React.FunctionComponent | StyledComponent | React.NamedExoticComponent | React.ComponentClass | string;

export type ReactStyleObject = {
	[key: string]: object
};

export type ExistingStyles = ReactStyleObject | ReactStyleObject[];

export interface StyleContext {
	tag: string;
	className?: string;
	id?: string;
	children: StyleContext[];
	siblings: StyleContext[];
	parent?: StyleContext;
}

export type StylePath = StyleContext[];

export interface InheritStyleContext {}

export interface InheritChildStyleContext {
	siblings: StyleContext[];
	parent: StyleContext;
}

export interface StyleInfo {
	styleContext: StyleContext;
	stylePath: StylePath;
	inheritStyleContext: InheritStyleContext;
	inheritChildStyleContext?: InheritChildStyleContext;
}

export const StyleInfoKey = '__StyleInfo__'; //Symbol('style')

export type StyleProps = React.PropsWithChildren<{
	id?: string;
	className?: string;
	[StyleInfoKey]: StyleInfo;
	needsStyleInfo?: boolean;
}>;

export interface ChildStyleContext {

}