export function formatPrepTimeRange(prepTime: number): string {
    if (prepTime <= 0) return 'N/A';
    const min = Math.max(1, prepTime - 4);
    const max = prepTime + 4;
    return `${min}-${max} min`;
}
