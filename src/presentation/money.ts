/** Format integer cents as a French euro string, e.g. 150 → "1,50 €". */
export function formatEuros(cents: number): string {
	return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}
