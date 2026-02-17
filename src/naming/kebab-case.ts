export function kebabCase(property: string): string {
	return property.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}