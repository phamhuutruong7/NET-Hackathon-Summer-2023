import * as pulumi from '@pulumi/pulumi';

export function toPascalCase(value: string | undefined, delimiter: string = '-') {
  if (value === undefined) {
    return undefined;
  }

  return value
    .split(delimiter)
    .map((s) => s[0].toUpperCase() + s.substr(1).toLocaleLowerCase())
    .join('');
}

export function replaceAll(string: string, search: string, replace: string) {
  return string.split(search).join(replace);
}

// convenient logging function to 'console.log' an output or multiple
export function log<T>(message: string, ...output: pulumi.Output<T>[]) {
  if (output.length == 0) {
    return;
  }

  if (output.length == 1) {
    output[0].apply((x) => console.log(message, x));

    return;
  }

  pulumi.all(output).apply((unwrapped) => console.log(message, unwrapped));
}

// convenient logging function to 'console.log' an output with a string-template in C# style String.Format("Data: {0}-{1}", arg1, arg2)
export function logWithTemplate<T>(template: string, ...output: pulumi.Output<T>[]) {
  pulumi.all(output).apply((unwrapped) => console.log(prettyFormat(template, ...unwrapped)));
}

// C# style String.Format("Data: {0}-{1}", arg1, arg2)
export function prettyFormat(tmpl: string, ...args: any[]) {
  return tmpl.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
}