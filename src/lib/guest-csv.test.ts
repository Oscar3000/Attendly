import { describe, expect, it } from "vitest";
import { parseGuestCsv } from "./guest-csv";

describe("parseGuestCsv", () => {
  it("reads names and plus-ones without a header", () => {
    expect(parseGuestCsv("Ada Obi, 1\nBola Ade").rows).toEqual([
      { name: "Ada Obi", plusOne: 1 },
      { name: "Bola Ade", plusOne: 0 },
    ]);
  });

  it("finds the columns from a header, in any order", () => {
    const { rows } = parseGuestCsv("plusOne,name\n2,Ada\n,Bola");
    expect(rows).toEqual([
      { name: "Ada", plusOne: 2 },
      { name: "Bola", plusOne: 0 },
    ]);
  });

  it("isn't fooled by the mark Excel puts at the start of a file", () => {
    const { rows } = parseGuestCsv("﻿name,plusOne\r\nAda,1\r\n");
    expect(rows).toEqual([{ name: "Ada", plusOne: 1 }]);
  });

  it("keeps commas and quotes inside quoted names", () => {
    const { rows } = parseGuestCsv('"Obi, Ada",1\n"Bola ""Bee"" Ade",0');
    expect(rows.map((row) => row.name)).toEqual(["Obi, Ada", 'Bola "Bee" Ade']);
  });

  it("skips rows it can't read, numbering them as in the file", () => {
    const { rows, errors } = parseGuestCsv("name,plusOne\nAda,1\n,2\nBola,two\nCy,-1");
    expect(rows).toEqual([{ name: "Ada", plusOne: 1 }]);
    expect(errors).toEqual([
      "Row 3: missing name",
      'Row 4: invalid plus-ones "two"',
      'Row 5: invalid plus-ones "-1"',
    ]);
  });

  it("skips a row over the plus-one limit, not the whole list", () => {
    const { rows, errors } = parseGuestCsv("Ada,50\nBola,51");
    expect(rows).toEqual([{ name: "Ada", plusOne: 50 }]);
    expect(errors).toEqual(["Row 2: at most 50 plus-ones"]);
  });

  it("ignores blank lines, and has nothing to say about empty input", () => {
    expect(parseGuestCsv("\n  \nAda\n\n").rows).toHaveLength(1);
    expect(parseGuestCsv("  \n")).toEqual({ rows: [], errors: [] });
  });
});
