import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { setTimeout } from "timers/promises";

export async function runBotCrefisa(
  username,
  password,
  cpf,
  benefitNumber,
  clientName
) {
  const downloadPath = path.resolve("./downloads");
  fs.mkdirSync(downloadPath, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--start-maximized"],
  });
  const page = await browser.newPage();

  try {
    console.log("Acessando o site da Crefisa...");

    await page.goto(
      "https://sfc.sistemascr.com.br/autorizador/Login/AC.UI.LOGIN.aspx?FISession=f993a8108d9c"
    );

    await page.waitForSelector("#EUsuario_CAMPO", { timeout: 60000 });

    // Login
    await page.type("#EUsuario_CAMPO", username);
    await page.type("#ESenha_CAMPO", password);
    await Promise.all([
      page.click("#lnkEntrar"),
      setupDialogAutoConfirm(page),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    // Acessar opção do menu: AUTORIZAÇÃO PARA CONSULTAS DE DADOS DO BENEFICIÁRIO
    await page.waitForSelector(
      "#navbar-collapse-funcao > ul > li:nth-child(4)",
      { timeout: 5000 }
    );
    await page.goto(
      "https://sfc.sistemascr.com.br/autorizador/MenuWeb/INSS/DadosBeneficiario/UI.CD.DadosBeneficiario.aspx"
    );

    // Preencher dados do cliente
    await page.waitForSelector(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_txtCpfCli_CAMPO",
      { timeout: 30000 }
    );

    await page.type(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_txtCpfCli_CAMPO",
      cpf,
      { delay: 150 }
    );

    await page.click(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_txtNomeCli_CAMPO"
    );

    await setupDialogAutoConfirm(page);

    await page.waitForSelector(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_txtNomeCli_CAMPO"
    );

    await page.type(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_txtNomeCli_CAMPO",
      clientName,
      { delay: 150 }
    );

    await page.type(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_txtLocalAssTermo_CAMPO",
      "SAO PAULO"
    );

    // (Opcional) Representante legal
    // await page.click('#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_ckbReprLegal');
    // await page.type('#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_txtCPFRepr_CAMPO', '12345678900');
    // await page.type('#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_txtNomeRepr_CAMPO', 'REPRESENTANTE');

    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath,
    });

    // Espera o botão aparecer e ficar clicável
    await page.waitForSelector("#btnImprimirTermo_txt", {
      visible: true,
      timeout: 10000,
    });

    // Garante que o botão não está desabilitado
    await page.waitForFunction(
      () => {
        const btn = document.querySelector("#btnImprimirTermo_txt");
        return btn && !btn.disabled;
      },
      { timeout: 10000 }
    );

    // Clica no botão
    await page.click("#btnImprimirTermo_txt");

    await page.waitForFunction(
      () => {
        const el = document.querySelector("#ctl00_UpdPrs");
        return el && window.getComputedStyle(el).display === "none";
      },
      { timeout: 10000 }
    ); // timeout opcional de 10 segundos

    await page.waitForSelector(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_tab",
      { timeout: 30000 }
    );

    // Selecionar nova aba: SOLICITAÇÃO DE AUTORIZAÇÃO PARA CONSULTA
    await page.click(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_tab"
    );

    await page.waitForSelector(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_cboChaveTermo_CAMPO"
    );

    await page.type(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_txtCPFCliente_CAMPO",
      cpf
    );

    // Selecionar primeira chave

    await page.waitForSelector(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_cboChaveTermo_CAMPO > option"
    );

    const options = await page.$$(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_cboChaveTermo_CAMPO > option"
    );

    const optionValue = await page.evaluate(
      (option) => option.value,
      options[1]
    );

    // Usa setValue + dispatchEvent
    await page.waitForFunction(() => {
      const select = document.querySelector(
        "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_cboChaveTermo_CAMPO"
      );
      return select && select.options.length > 1;
    });

    await setTimeout(2000);

    await page.select(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_cboChaveTermo_CAMPO",
      optionValue
    );

    console.log(`Chave ${optionValue} selecionada`);

    // Selecionar tipo de documento (RG)

    await page.waitForSelector(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_cboDocIdentifCli_CAMPO"
    );
    await page.select(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_cboDocIdentifCli_CAMPO",
      "6"
    );

    // Anexar arquivo (duas vezes)
    const filePath = path.join(
      downloadPath,
      fs.readdirSync(downloadPath).find((f) => f.endsWith(".pdf"))
    );

    await page.waitForSelector(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_grdArquivosUpload_ctl02_UpdatePanelEnviarArquivoUpload > label"
    );

    const fileInput = await page.waitForSelector("#FileMultArqUpload");
    await fileInput.uploadFile(filePath);

    console.log("Arquivo de identificação anexado");

    // Realizar upload
    await page.waitForSelector("#btnRealizarUpload_txt");
    await page.click("#btnRealizarUpload_txt");
    console.log("Upload do arquivo feito com sucesso");

    await page.waitForSelector(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_grdArquivosUpload_ctl02_UpdatePanelEnviarArquivoUpload > label"
    );

    // Aguarda o input file ser adicionado ao DOM
    const fileInput2 = await page.waitForSelector("#FileUpGrd2");
    await fileInput2.uploadFile(filePath);

    console.log("Termo de autorização anexado");

    await page.waitForSelector("#btnSolicitarAutorizacao_txt");

    // Solicitar autorização
    await page.click("#btnSolicitarAutorizacao_txt");

    await page.waitForSelector(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_UpdatePanel2"
    );

    console.log("Autorização solicitada!");

    await page.waitForSelector("#btnVoltar_txt", { timeout: 5000 });

    // Segunda parte: CONSULTA DE DADOS DO BENEFICIO
    console.log(
      "Redirecionando até a página de consulta de dados do benefício"
    );

    await page.goto(
      "https://sfc.sistemascr.com.br/autorizador/MenuWeb/INSS/ConsultaBeneficio/UI.CD.ConsBen.aspx"
    );

    await page.waitForSelector(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_txtCPFCliente_CAMPO"
    );
    await page.type(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_txtCPFCliente_CAMPO",
      cpf
    );

    await page.keyboard.press("Enter");

    await page.waitForFunction(() => {
      const select = document.querySelector(
        "#ctl00_Cph_jp1_pnlDadosBeneficiario_ddlNomeCli_CAMPO"
      );
      return select && select.options.length > 1;
    });

    await setTimeout(2000);

    await page.select(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_ddlNomeCli_CAMPO",
      clientName
    );

    await page.waitForSelector("#btnObterBeneficios_txt", { timeout: 1500 });

    await page.waitForFunction(() => {
      const btnSpan = document.querySelector(
        "#ctl00_Cph_jp1_pnlDadosBeneficiario_btnObterBeneficios"
      );
      return btnSpan && !btnSpan.hasAttribute("disabled");
    });

    await page.click("#btnObterBeneficios_txt");

    await page.waitForFunction(() => {
      const el = document.querySelector(
        "#ctl00_Cph_jp1_pnlDadosBeneficiario_ddlBeneficios_CAMPO"
      );
      return el && el.tagName.toLowerCase() === "select";
    });

    const benefitOptions = await page.$$eval(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_ddlBeneficios_CAMPO option",
      (opts) => opts.map((opt) => ({ value: opt.value, text: opt.textContent }))
    );
    const selectedBenefit = benefitOptions.find((opt) =>
      opt.text.includes(benefitNumber)
    );
    if (!selectedBenefit) throw new Error("Benefício não encontrado.");

    await page.select(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_ddlBeneficios_CAMPO",
      selectedBenefit.value
    );

    await page.waitForFunction(() => {
      const btnSpan = document.querySelector(
        "#ctl00_Cph_jp1_pnlDadosBeneficiario_btnConsultarBeneficio"
      );
      return btnSpan && !btnSpan.hasAttribute("disabled");
    });

    await page.waitForSelector("#btnConsultarBeneficio_txt");
    await page.click("#btnConsultarBeneficio_txt");
    await page.waitForSelector('table[style*="color:Black"]');

    const result = await page.evaluate(() => {
      const rows = document.querySelectorAll(
        'table[style*="color:Black"] table tr'
      );
      const data = {};
      rows.forEach((row) => {
        const cols = row.querySelectorAll("td");
        if (cols.length === 2) {
          const key = cols[0].innerText.trim();
          const value = cols[1].innerText.trim();
          data[key] = value;
        }
      });
      return data;
    });

    clearDownloadFolder(downloadPath);
    await browser.close();

    return result;
  } catch (error) {
    clearDownloadFolder(downloadPath);
    console.error("Erro no bot:", error);
    await browser.close();
    throw new Error(error.message);
  }
}

/**
 * Configura o Puppeteer para confirmar automaticamente qualquer alerta que aparecer na tela.
 * Aguarda alguns segundos por segurança, caso o alerta demore a surgir.
 * @param {import('puppeteer').Page} page - Página do Puppeteer
 */
async function setupDialogAutoConfirm(page, timeoutMs = 5000) {
  return new Promise((resolve) => {
    let resolved = false;

    const handleDialog = async (dialog) => {
      console.log(`Alerta detectado: "${dialog.message()}"`);
      await dialog.accept();
      resolved = true;
      resolve(true); // Alert detected and accepted
    };

    page.once("dialog", handleDialog);

    // Timeout: se nenhum dialog aparecer, resolver após o tempo
    setTimeout(() => {
      if (!resolved) {
        page.removeListener("dialog", handleDialog);
        resolve(false); // Nenhum alert detectado
      }
    }, timeoutMs);
  });
}

function clearDownloadFolder(folderPath) {
  try {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      fs.unlinkSync(path.join(folderPath, file));
    }
    console.log("Pasta limpa:", folderPath);
  } catch (err) {
    console.error("Erro ao limpar a pasta:", err);
  }
}
