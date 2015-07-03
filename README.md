# pan-genome-charts
charts for the pan genome paper

Scripts for generating Figure 1 in [Age-related mutations associated with clonal hematopoietic expansion and malignancies](http://www-ncbi-nlm-nih-gov.libproxy.wustl.edu/pubmed/25326804).

Uses d3. Run the Python SimpleHTTPServer in the repository root directory and load index.html for Panel A, and index2.html for Panel B.

```bash
cd pan-genome-charts
python -m SimpleHTTPServer
```

After the webserver boots up, load these links in a browser:

[http://localhost:8000/index.html](http://localhost:8000/index.html)
[http://localhost:8000/index2.html](http://localhost:8000/index2.html)

The scripts generate the underlying vector shapes and lines for the charts, then saved as an SVG using SVG Crowbar. Some color adjustments and the cancer group labels were added in Illustrator.
