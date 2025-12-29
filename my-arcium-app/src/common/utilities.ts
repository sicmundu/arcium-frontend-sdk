export const classNames = (...args: any[]): string => {
    return args.filter(Boolean).join(' ');
};
