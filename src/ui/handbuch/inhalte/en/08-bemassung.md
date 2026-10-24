# Dimensioning

Dimensions come from the drawing: you click two points, and the program works out the length from
the [calibration](#kalibrieren) and writes it on the dimension line. If you later move one of the
points, the dimension updates with it.

## Single dimension {#einzelmass}

1. Choose {{befehl:werkzeug.bemassung}}.
2. Click the first measuring point (object snap helps you hit the corner exactly).
3. Click the second measuring point.
4. Drag the dimension line out to the required distance and click.

![Single, chain and baseline dimensions](bemassung.png)

## Chain dimension {#kettenbemassung}

{{befehl:werkzeug.kettenbemassung}} sets several dimensions in one continuous line – for example
windows, piers and axes, one after another. Set them point by point; each new dimension connects
to the previous one. **Enter** ends the chain.

## Baseline dimension {#parallelbemassung}

{{befehl:werkzeug.parallelbemassung}} measures from **one** reference point to several targets; the
dimension lines are staggered one above the other. Here too, **Enter** ends the series.

Both variants are also in the drop-down menu of the dimension tool in the sidebar.

## Edit dimensions {#masse-bearbeiten}

Select a dimension and you can change the following in the properties panel:

- the **dimension text** (overwrite it, e.g. “≈ 3,25” or an addition such as “OK raw ceiling”),
- the **number of decimal places** and the unit shown,
- the **offset** of the dimension line from the measured object,
- the **font size**.

Dimensions usually sit on their own [layer](#ebenen), so you can hide them for a presentation with
one click.
