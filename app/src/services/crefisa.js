import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

export async function runBotCrefisa(
  username,
  password,
  cpf,
  benefitNumber,
  clientName
) {
  const downloadPath = path.resolve("../downloads");
  fs.mkdirSync(downloadPath, { recursive: true });
  const beforeFiles = fs.readdirSync(downloadPath);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--start-maximized"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "pt-BR,pt;q=0.9",
    Referer: "https://google.com",
  });

  try {
    console.log("Acessando o site da Crefisa...");

    await page.goto("https://sfc.sistemascr.com.br/autorizador/Login/");

    const errorPage = await page.$("#ipAddress", { timeout: 5000 });

    if (errorPage) {
      const h1 = await page.$("body > section > div > center > h1");
      const text = await page.evaluate((el) => el.textContent, h1);

      console.log(`ip: ${text}`);

      console.log("Erro ao acessar o site da Crefisa. Verifique sua conexão.");
      await browser.close();
      throw new Error(
        "O portal está indisponível no momento, pois o horário de funcionamento é das 08h00 às 21h00."
      );
    }

    try {
      await page.waitForSelector("#EUsuario_CAMPO", { timeout: 60000 });
    } catch (error) {
      await page.screenshot({ path: "erro_timeout.png" });
      const html = await page.content();
      console.error("Erro ao buscar seletor. HTML:", html);
      throw error;
    }

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
      cpf
    );

    console.log("Digitando o CPF do cliente...");

    await page.click(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_txtNomeCli_CAMPO"
    );

    await setupDialogAutoConfirm(page);

    await page.waitForSelector(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_txtNomeCli_CAMPO"
    );

    console.log("Digitando o nome do cliente...");

    await page.type(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_txtNomeCli_CAMPO",
      clientName
    );

    await page.type(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_txtLocalAssTermo_CAMPO",
      "SAO PAULO"
    );

    console.log("Digitando o local de assinatura...");

    // (Opcional) Representante legal
    // await page.click('#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_ckbReprLegal');
    // await page.type('#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_txtCPFRepr_CAMPO', '12345678900');
    // await page.type('#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_AbaTermoAutorizacao_txtNomeRepr_CAMPO', 'REPRESENTANTE');

    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath,
    });

    console.log("Aguardando o botão de imprimir aparecer...");

    // Espera o botão aparecer e ficar clicável
    try {
      await page.waitForSelector("#btnImprimirTermo_txt", {
        visible: true,
        timeout: 30000,
      });
    } catch (error) {
      await page.screenshot({ path: "erro_timeout.png" });
      console.error("Erro ao esperar o botão de imprimir:", error);
      await browser.close();
      throw new Error("Erro ao esperar o botão de imprimir.");
    }

    try {
      await page.waitForFunction(
        () => {
          const btn = document.querySelector("#btnImprimirTermo_txt");
          return btn && !btn.disabled;
        },
        { timeout: 30000 }
      );
    } catch (error) {
      await page.screenshot({ path: "erro_timeout.png" });
      console.error("Erro ao esperar o botão de imprimir:", error);
      await browser.close();
      throw new Error("Erro ao esperar o botão de imprimir.");
    }

    // Clica no botão
    await page.click("#btnImprimirTermo_txt");

    console.log("Botão de imprimir clicado!");

    try {
      await page.waitForFunction(
        () => {
          const el = document.querySelector("#ctl00_UpdPrs");
          return !el || window.getComputedStyle(el).display === "none";
        },
        { timeout: 30000 }
      );
    } catch (error) {
      await page.screenshot({ path: "erro_timeout.png" });
      console.error("Erro ao esperar o elemento desaparecer:", error);
      await browser.close();
      throw new Error(
        "Erro ao esperar o elemento de carregamento desaparecer."
      );
    }

    let downloadedFile;
    for (let i = 0; i < 30; i++) {
      await new Promise((res) => setTimeout(res, 1000)); // espera 1s

      const afterFiles = fs.readdirSync(downloadPath);
      const newFiles = afterFiles.filter((f) => !beforeFiles.includes(f));

      if (
        newFiles.length > 0 &&
        !newFiles.some((f) => f.endsWith(".crdownload"))
      ) {
        downloadedFile = newFiles[0];
        break;
      }
    }

    if (downloadedFile) {
      console.log("Download detectado:", downloadedFile);
    } else {
      console.log("Nenhum arquivo novo detectado na pasta de downloads.");
      await page.screenshot({ path: "erro_timeout.png" });
      throw new Error(
        "Timeout: Nenhum arquivo novo foi detectado na pasta de downloads."
      );
    }

    console.log("Download do termo de autorização concluído!");

    await page.waitForSelector(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_tab",
      { timeout: 30000 }
    );

    console.log("Aba de consulta de dados do benefício encontrada!");
    console.log("Acessando a aba de consulta de dados do benefício...");

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

    console.log("Digitando o CPF do cliente na aba de consulta...");

    // Selecionar primeira chave

    try {
      await page.waitForSelector(
        "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_cboChaveTermo_CAMPO > option"
      );
    } catch (error) {
      await page.screenshot({ path: "erro_timeout.png" });
      console.error("Erro ao esperar a opção de chave:", error);
      await browser.close();
      throw new Error("Erro ao esperar a opção de chave.");
    }

    console.log("Aguardando as opções de chave aparecerem...");

    const options = await page.$$(
      "#ctl00_Cph_jp1_pnlDadosBeneficiario_Container_ConsultaDadosBeneficio_cboChaveTermo_CAMPO > option"
    );

    console.log("Opções de chave encontradas!");

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

    await sleep(1000);

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

    console.log("Tipo de documento selecionado!");

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

    await sleep(1000);

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
async function setupDialogAutoConfirm(page) {
  const timeoutMs = 3000;
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

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
