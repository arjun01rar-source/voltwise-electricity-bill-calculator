# VoltWise — Premium Electricity Bill Calculator

A responsive, branded electricity estimate web application with a C++ OOP billing engine (compiled to WebAssembly by GitHub Actions).

## What's included
- Premium responsive GUI with Delhi, Haryana and Mumbai region selection
- Domestic and Commercial connection categories
- Customer name, account ID, meter number and service address
- Billing date with native calendar picker and previous/current meter readings
- Auto calculation of consumption from meter readings
- Progressive demo tariff slabs, fixed charge, subsidy and tax
- Branded PDF estimate download, local history and light mode
- C++ OOP source: abstraction, encapsulation, inheritance and polymorphism

> **Academic project disclaimer:** All included tariff values are illustrative demo values only. They are not official current tariffs, utility-approved charges or a payment demand. Verify and replace tariff data from official sources before representing it as real billing data.

## Run locally in VS Code (no Python)
1. Extract this folder and open it in VS Code.
2. Install the **Live Server** extension by Ritwick Dey.
3. Open `index.html`, right-click and choose **Open with Live Server**.
4. PDF download uses jsPDF from a CDN, so keep an internet connection when downloading PDFs.

## C++ WebAssembly build (no local Python / Emscripten)
The `.github/workflows/build-wasm.yml` workflow compiles `cpp/bill_engine.cpp` on a GitHub-hosted runner using the Emscripten Docker image. Push the project to a GitHub repository's `main` branch; then open the repository's **Actions** tab and check that “Build C++ WebAssembly” succeeds. The workflow commits `bill_engine.js` and `bill_engine.wasm` back to the repository. The GUI falls back to a matching JavaScript preview calculation until those generated C++ files are available.

## GitHub upload
Create a repository named `voltwise-electricity-bill-calculator`, then use the VS Code Source Control panel to initialize the repository, stage files, commit, and publish to GitHub. Or use the integrated terminal if Git is installed:

```bash
git init
git add .
git commit -m "Create VoltWise electricity bill calculator"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/voltwise-electricity-bill-calculator.git
git push -u origin main
```

## Vercel deployment
1. Import the GitHub repository in Vercel.
2. Framework preset: Other.
3. Build command: leave blank.
4. Output directory: `.`.
5. Deploy. Once GitHub Actions generates the WebAssembly files, Vercel will redeploy from the updated repository.

## OOP concepts in `cpp/bill_engine.cpp`
- **Abstraction:** `ElectricityCalculator` is an abstract class because `connectionName()` is pure virtual.
- **Encapsulation:** tariff data is private; derived classes access controlled getter methods.
- **Inheritance:** `DomesticCalculator` and `CommercialCalculator` inherit from `ElectricityCalculator`.
- **Polymorphism:** `calculate()` and `connectionName()` are virtual; the base-class pointer invokes the derived implementation.
- **Constructor / Objects:** constructors initialize calculator instances; `BillEngine` creates the appropriate calculator object.
