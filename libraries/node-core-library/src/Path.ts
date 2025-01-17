// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as path from 'path';

/**
 * Options for {@link Path.formatConcisely}.
 * @public
 */
export interface IPathFormatConciselyOptions {
  /**
   * The path to be converted.
   */
  pathToConvert: string;
  /**
   * The base path to use when converting `pathToConvert` to a relative path.
   */
  baseFolder: string;
}

/**
 * Common operations for manipulating file and directory paths.
 * @remarks
 * This API is intended to eventually be a complete replacement for the NodeJS "path" API.
 * @public
 */
export class Path {
  // Matches a relative path consisting entirely of periods and slashes
  // Example: ".", "..", "../..", etc
  private static _relativePathRegex: RegExp = /^[.\/\\]+$/;

  // Matches a relative path segment that traverses upwards
  // Example: "a/../b"
  private static _upwardPathSegmentRegex: RegExp = /([\/\\]|^)\.\.([\/\\]|$)/;

  /**
   * Returns true if "childPath" is located inside the "parentFolderPath" folder
   * or one of its child folders.  Note that "parentFolderPath" is not considered to be
   * under itself.  The "childPath" can refer to any type of file system object.
   *
   * @remarks
   * The indicated file/folder objects are not required to actually exist on disk.
   * For example, "parentFolderPath" is interpreted as a folder name even if it refers to a file.
   * If the paths are relative, they will first be resolved using path.resolve().
   */
  public static isUnder(childPath: string, parentFolderPath: string): boolean {
    // If childPath is under parentPath, then relativePath will be something like
    // "../.." or "..\\..", which consists entirely of periods and slashes.
    // (Note that something like "....t" is actually a valid filename, but "...." is not.)
    const relativePath: string = path.relative(childPath, parentFolderPath);
    return Path._relativePathRegex.test(relativePath);
  }

  /**
   * Returns true if "childPath" is equal to "parentFolderPath", or if it is inside that folder
   * or one of its children.  The "childPath" can refer to any type of file system object.
   *
   * @remarks
   * The indicated file/folder objects are not required to actually exist on disk.
   * For example, "parentFolderPath" is interpreted as a folder name even if it refers to a file.
   * If the paths are relative, they will first be resolved using path.resolve().
   */
  public static isUnderOrEqual(childPath: string, parentFolderPath: string): boolean {
    const relativePath: string = path.relative(childPath, parentFolderPath);
    return relativePath === '' || Path._relativePathRegex.test(relativePath);
  }

  /**
   * Returns true if `path1` and `path2` refer to the same underlying path.
   *
   * @remarks
   *
   * The comparison is performed using `path.relative()`.
   */
  public static isEqual(path1: string, path2: string): boolean {
    return path.relative(path1, path2) === '';
  }

  /**
   * Formats a path to look nice for reporting purposes.
   * @remarks
   * If `pathToConvert` is under the `baseFolder`, then it will be converted to a relative with the `./` prefix.
   * Otherwise, it will be converted to an absolute path.
   *
   * Backslashes will be converted to slashes, unless the path starts with an OS-specific string like `C:\`.
   */
  public static formatConcisely(options: IPathFormatConciselyOptions): string {
    // Same logic as Path.isUnderOrEqual()
    const relativePath: string = path.relative(options.pathToConvert, options.baseFolder);
    const isUnderOrEqual: boolean = relativePath === '' || Path._relativePathRegex.test(relativePath);

    if (isUnderOrEqual) {
      // Note that isUnderOrEqual()'s relativePath is the reverse direction
      return './' + Path.convertToSlashes(path.relative(options.baseFolder, options.pathToConvert));
    }

    const absolutePath: string = path.resolve(options.pathToConvert);
    return absolutePath;
  }

  /**
   * Replaces Windows-style backslashes with POSIX-style slashes.
   *
   * @remarks
   * POSIX is a registered trademark of the Institute of Electrical and Electronic Engineers, Inc.
   */
  public static convertToSlashes(inputPath: string): string {
    return inputPath.replace(/\\/g, '/');
  }

  /**
   * Replaces POSIX-style slashes with Windows-style backslashes
   *
   * @remarks
   * POSIX is a registered trademark of the Institute of Electrical and Electronic Engineers, Inc.
   */
  public static convertToBackslashes(inputPath: string): string {
    return inputPath.replace(/\//g, '\\');
  }

  /**
   * Returns true if the specified path is a relative path and does not use `..` to walk upwards.
   *
   * @example
   * ```ts
   * // These evaluate to true
   * isDownwardRelative('folder');
   * isDownwardRelative('file');
   * isDownwardRelative('folder/');
   * isDownwardRelative('./folder/');
   * isDownwardRelative('./folder/file');
   *
   * // These evaluate to false
   * isDownwardRelative('../folder');
   * isDownwardRelative('folder/../file');
   * isDownwardRelative('/folder/file');
   * ```
   */
  public static isDownwardRelative(inputPath: string): boolean {
    if (path.isAbsolute(inputPath)) {
      return false;
    }
    // Does it contain ".."
    if (Path._upwardPathSegmentRegex.test(inputPath)) {
      return false;
    }
    return true;
  }
}
