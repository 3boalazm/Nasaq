# {{name}} — 06 Delivery and lifecycle (size L)

Phase: Handover. Purpose: the client receives everything needed to use the identity without the studio, knows what they own, and knows how the system is kept up to date.

## 1 Formats

| Asset | Deliver |
|---|---|
| Logos | SVG, PDF and EPS (vector); PNG with transparent ground at 3 sizes; every version in module 03 |
| Colour | Values file with HEX, RGB and CMYK (and Pantone if used); swatch file for the design tool |
| Source files | Editable originals, text live, linked assets packaged |
| Fonts | Licence proof and download source. Font files only when the licence allows passing them on |
| Templates | Editable files in the tool the client's team uses, tested by AT-BASE-TPL-01 |
| Guide | PDF and an editable version |

## 2 Folders

```
01_Logo/  (AR, EN, Bilingual → Vector, PNG)
02_Colour/
03_Type/
04_Graphic-elements/
05_Templates/
06_Applications/
07_Guide/
08_Licences/
99_Archive/
```

## 3 Names and versions

- Name: `brand_asset_variant_lang_colour_mode_v1.0.ext`, for example `acme_logo_primary_ar_fullcolour_rgb_v1.0.svg`. Lower case, no spaces.
- v0.x is a draft. v1.0 is the approved version. A change after delivery raises the number; the old file moves to 99_Archive and is not deleted.

## 4 Rights and licences

Write down, following the contract (this is not legal advice): what the client owns and from when; what is licensed and not owned (fonts, stock, AI imagery) and in whose name; whether unused routes stay with the studio; whether the studio may show the work.

## 5 Asset register

| Asset | Version | Licence | Source | Used in |
|---|---|---|---|---|

## 6 Documentation

| Document | Format | Delivered on |
|---|---|---|
| Brand guide | PDF and editable | _ |
| File index (what each file is for) | _ | _ |
| Licence pack (fonts, imagery, AI assets) | _ | _ |
| Usage session with the client's team | Recording or notes | _ |
| Case-study notes (only with approval) | _ | _ |

## 7 Maintenance

Name the person who owns the guide on the client side, the date of the first review, and how changes are requested.

| Guide owner on the client side | First review date | How to request a change |
|---|---|---|
| _to fill_ | _ | _ |

## 8 Gate: closing the project

- [ ] Every test in 05_Quality_Validation.md run with evidence.
- [ ] Every finding in 00_Risk_Register.md is Fixed or Deferred with a dated decision.
- [ ] Handoff.md complete; Asset register (section 5) and Proof list (module 05) complete.
- [ ] Delivery receipt, and licences delivered to the client.
- [ ] Case-study notes only with approval.
