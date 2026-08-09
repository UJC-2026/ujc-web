import { describe, expect, it } from "vitest";
import {
  divisionOptions,
  scopeToDivision,
  searchMembers,
  type OrgMember,
  type OrgPosition,
} from "./queries";

function member(name: string, city: string | null = null): OrgMember {
  return {
    id: `m-${name}`,
    position_id: "p",
    user_id: null,
    display_name: name,
    photo_url: null,
    motto: null,
    city,
    contact: {},
    status: "aktif",
    sort_order: 0,
  };
}

function position(
  id: string,
  name: string,
  members: OrgMember[] = [],
  children: OrgPosition[] = [],
): OrgPosition {
  return {
    id,
    period_id: "2026",
    parent_position_id: null,
    name,
    description: null,
    cover_url: null,
    sort_order: 0,
    members,
    children,
    totalMembers: members.length,
  };
}

const tree: OrgPosition[] = [
  position("ketua", "Ketua Umum", [member("Rani", "Nagoya")]),
  position(
    "media",
    "Divisi Media",
    [member("Bagus", "Osaka")],
    [position("desain", "Sub Desain", [member("Cindy", "Kyoto")])],
  ),
];

describe("scopeToDivision", () => {
  it("returns the whole tree when nothing is selected", () => {
    expect(scopeToDivision(tree)).toHaveLength(2);
  });

  it("narrows to the selected branch, keeping its children", () => {
    const scoped = scopeToDivision(tree, "media");
    expect(scoped).toHaveLength(1);
    expect(scoped[0].name).toBe("Divisi Media");
    expect(scoped[0].children[0].name).toBe("Sub Desain");
  });

  it("finds a branch nested below the roots", () => {
    expect(scopeToDivision(tree, "desain")[0]?.name).toBe("Sub Desain");
  });

  // Switching period keeps the URL's divisi id, which belongs to the period
  // that was open before. Showing everything would look like the filter had
  // silently turned itself off.
  it("returns nothing for an id from another period", () => {
    expect(scopeToDivision(tree, "id-tidak-dikenal")).toEqual([]);
  });
});

describe("searchMembers", () => {
  it("matches a member by name", () => {
    const hits = searchMembers(tree, "rani");
    expect(hits).toHaveLength(1);
    expect(hits[0].member.display_name).toBe("Rani");
  });

  it("matches by city and by the name of the position", () => {
    expect(searchMembers(tree, "osaka")[0].member.display_name).toBe("Bagus");
    expect(searchMembers(tree, "divisi media")[0].member.display_name).toBe(
      "Bagus",
    );
  });

  it("reaches members nested below the roots", () => {
    expect(searchMembers(tree, "kyoto")[0].member.display_name).toBe("Cindy");
  });

  it("reports which position each hit belongs to", () => {
    expect(searchMembers(tree, "cindy")[0].position.name).toBe("Sub Desain");
  });

  it("ignores case and surrounding whitespace", () => {
    expect(searchMembers(tree, "  RANI  ")).toHaveLength(1);
  });

  it("returns nothing for an empty term rather than everyone", () => {
    expect(searchMembers(tree, "   ")).toEqual([]);
  });
});

describe("divisionOptions", () => {
  // UJC's real chart: one Ketua Umum with the divisions beneath it. Offering
  // the roots would offer a single chip meaning "everything".
  it("descends past a lone root to the divisions under it", () => {
    const chart = [
      position("ketua", "Ketua Umum", [], [
        position("media", "Divisi Media"),
        position("pendidikan", "Divisi Pendidikan"),
      ]),
    ];

    expect(divisionOptions(chart).map((n) => n.name)).toEqual([
      "Divisi Media",
      "Divisi Pendidikan",
    ]);
  });

  it("uses the roots when a chart has several", () => {
    expect(divisionOptions(tree).map((n) => n.name)).toEqual([
      "Ketua Umum",
      "Divisi Media",
    ]);
  });

  it("keeps a lone childless root rather than offering nothing", () => {
    const chart = [position("solo", "Ketua Umum")];
    expect(divisionOptions(chart).map((n) => n.name)).toEqual(["Ketua Umum"]);
  });
});
