import { SelectField, RadioGroupField } from "@/components/forms/multi-step/Fields"
import { TextField, CheckboxField } from "@/components/forms/multi-step/FormFields"
import type { StepDefinition } from "@/components/forms/multi-step/types"
import {
  PROVINCIAS_ANGOLA,
  FAIXAS_PRECO_DESDE,
  municipiosDeProvincia,
} from "@/lib/listas-selecao"

export type CategoriaOpcao = { id: string; nome: string }

export type DadosProfissional = {
  // Etapa 2
  nome: string
  fotoPerfil: File | null
  provincia: string
  municipio: string
  bairro: string
  // Etapa 3
  categoriaId: string
  especialidades: string
  descricao: string
  experiencia: string
  // Etapa 4
  precoFaixa: string
  disponibilidade: string
  fotosTrabalho: File[]
  // Etapa 5
  telefone: string
  mesmoNumeroWhatsapp: boolean
  whatsapp: string
}

export const dadosVazios: DadosProfissional = {
  nome: "",
  fotoPerfil: null,
  provincia: "",
  municipio: "",
  bairro: "",
  categoriaId: "",
  especialidades: "",
  descricao: "",
  experiencia: "",
  precoFaixa: "",
  disponibilidade: "",
  fotosTrabalho: [],
  telefone: "",
  mesmoNumeroWhatsapp: false,
  whatsapp: "",
}

const OPCOES_PROVINCIA = PROVINCIAS_ANGOLA.map((p) => ({ value: p, label: p }))

const OPCOES_EXPERIENCIA = [
  { value: "menos_1", label: "Menos de 1 ano" },
  { value: "1_3", label: "1 a 3 anos" },
  { value: "3_5", label: "3 a 5 anos" },
  { value: "mais_5", label: "Mais de 5 anos" },
]

const OPCOES_PRECO = FAIXAS_PRECO_DESDE.map((f) => ({ value: String(f.valor), label: f.rotulo }))

const OPCOES_DISPONIBILIDADE = [
  { value: "disponivel", label: "Disponível" },
  { value: "ocupado", label: "Ocupado" },
  { value: "indisponivel", label: "Indisponível" },
]

const CLASSE_FICHEIRO =
  "w-full rounded-[4px] border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 file:mr-3 file:rounded-[4px] file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-semibold dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:file:bg-neutral-800"

/**
 * As seis etapas do cadastro de profissional. Os ficheiros escolhidos permanecem locais e não são enviados.
 */
export function buildEtapasProfissional(
  categorias: ReadonlyArray<CategoriaOpcao>
): ReadonlyArray<StepDefinition<DadosProfissional>> {
  return [
    {
      id: "tipo-conta",
      title: "Tipo de conta",
      description: "A sua conta é de profissional. Pode alterar isto mais tarde, antes de publicar.",
      requiredFields: [],
      render: () => (
        <div className="rounded-[4px] border-2 border-orange-500 bg-orange-50 p-4 dark:bg-orange-950/30">
          <p className="font-heading text-lg font-bold text-neutral-900 dark:text-neutral-50">Profissional</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Mostre os seus serviços e receba pedidos de clientes em Angola, depois de aprovado.
          </p>
        </div>
      ),
    },
    {
      id: "dados-pessoais",
      title: "Dados pessoais",
      description: "Como os clientes o vão encontrar.",
      requiredFields: ["nome", "provincia", "municipio"],
      render: ({ data, errors, setField }) => {
        const municipios = municipiosDeProvincia(data.provincia)
        return (
          <>
            <TextField
              id="nome"
              label="Nome completo"
              value={data.nome}
              onChange={(v) => setField("nome", v)}
              required
              error={errors.nome}
              autoComplete="name"
            />
            <div className="flex flex-col gap-2">
              <label htmlFor="foto-perfil" className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Foto de perfil <span className="font-normal text-neutral-500">(opcional)</span>
              </label>
              <input
                id="foto-perfil"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setField("fotoPerfil", e.target.files?.[0] ?? null)}
                className={CLASSE_FICHEIRO}
              />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {data.fotoPerfil
                  ? `Selecionada: ${data.fotoPerfil.name}. Ainda não é enviada.`
                  : "PNG, JPG ou WebP. Ainda não é enviada nesta versão."}
              </p>
            </div>
            <SelectField
              id="provincia"
              label="Província"
              value={data.provincia}
              onChange={(v) => {
                setField("provincia", v)
                setField("municipio", "")
              }}
              options={OPCOES_PROVINCIA}
              required
              error={errors.provincia}
            />
            {municipios ? (
              <SelectField
                id="municipio"
                label="Município"
                value={data.municipio}
                onChange={(v) => setField("municipio", v)}
                options={municipios}
                required
                disabled={!data.provincia}
                hint={data.provincia ? undefined : "Escolha primeiro a província."}
                error={errors.municipio}
              />
            ) : (
              <TextField
                id="municipio"
                label="Município"
                value={data.municipio}
                onChange={(v) => setField("municipio", v)}
                required
                hint={
                  data.provincia
                    ? "Ainda não há lista de municípios para esta província. Escreva o nome."
                    : "Escolha primeiro a província."
                }
                error={errors.municipio}
              />
            )}
            <TextField
              id="bairro"
              label="Zona ou bairro"
              value={data.bairro}
              onChange={(v) => setField("bairro", v)}
              hint="Opcional."
            />
          </>
        )
      },
    },
    {
      id: "profissao-servicos",
      title: "Profissão e serviços",
      description: "O que faz e há quanto tempo.",
      requiredFields: ["categoriaId", "experiencia"],
      render: ({ data, errors, setField }) => (
        <>
          <SelectField
            id="categoria"
            label="Categoria ou profissão"
            value={data.categoriaId}
            onChange={(v) => setField("categoriaId", v)}
            options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
            placeholder="Escolha uma opção"
            required
            error={errors.categoriaId}
          />
          <TextField
            id="especialidades"
            label="Especialidades"
            value={data.especialidades}
            onChange={(v) => setField("especialidades", v)}
            hint="Opcional. Separe por vírgulas, por exemplo: instalação, manutenção."
          />
          <TextField
            id="descricao"
            label="Descrição curta"
            value={data.descricao}
            onChange={(v) => setField("descricao", v)}
            hint="Opcional. Uma ou duas frases sobre o seu trabalho."
          />
          <RadioGroupField
            id="experiencia"
            label="Experiência"
            value={data.experiencia}
            onChange={(v) => setField("experiencia", v)}
            options={OPCOES_EXPERIENCIA}
            required
            error={errors.experiencia}
          />
        </>
      ),
    },
    {
      id: "preco-disponibilidade",
      title: "Preço e disponibilidade",
      description: "Ajuda os clientes a saber o que esperar.",
      requiredFields: [],
      render: ({ data, setField }) => (
        <>
          <SelectField
            id="preco"
            label="Preço desde"
            value={data.precoFaixa}
            onChange={(v) => setField("precoFaixa", v)}
            options={OPCOES_PRECO}
            placeholder="Escolha uma faixa"
            hint="Opcional."
          />
          <RadioGroupField
            id="disponibilidade"
            label="Disponibilidade"
            value={data.disponibilidade}
            onChange={(v) => setField("disponibilidade", v)}
            options={OPCOES_DISPONIBILIDADE}
          />
          <div className="flex flex-col gap-2">
            <label htmlFor="fotos-trabalho" className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Fotos de trabalhos <span className="font-normal text-neutral-500">(opcional)</span>
            </label>
            <input
              id="fotos-trabalho"
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setField("fotosTrabalho", Array.from(e.target.files ?? []))}
              className={CLASSE_FICHEIRO}
            />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {data.fotosTrabalho.length > 0
                ? `${data.fotosTrabalho.length} foto(s) selecionada(s). Ainda não são enviadas.`
                : "Pode escolher várias imagens. Ainda não são enviadas nesta versão."}
            </p>
          </div>
        </>
      ),
    },
    {
      id: "contactos",
      title: "Contactos",
      description: "Estes contactos ficam visíveis para clientes depois de aprovado.",
      requiredFields: (d) => ["telefone", ...(d.mesmoNumeroWhatsapp ? [] : ["whatsapp"])],
      render: ({ data, errors, setField }) => (
        <>
          <TextField
            id="telefone"
            label="Telefone"
            type="tel"
            value={data.telefone}
            onChange={(v) => setField("telefone", v)}
            required
            error={errors.telefone}
            autoComplete="tel"
          />
          <CheckboxField
            id="mesmoNumeroWhatsapp"
            label="Usar o mesmo número do telefone no WhatsApp"
            checked={data.mesmoNumeroWhatsapp}
            onChange={(v) => setField("mesmoNumeroWhatsapp", v)}
          />
          {!data.mesmoNumeroWhatsapp && (
            <TextField
              id="whatsapp"
              label="WhatsApp"
              type="tel"
              value={data.whatsapp}
              onChange={(v) => setField("whatsapp", v)}
              required
              error={errors.whatsapp}
            />
          )}
        </>
      ),
    },
    {
      id: "revisao",
      title: "Revisão e envio",
      description: "Confirme os dados. Use \"Editar\" para corrigir qualquer etapa.",
      requiredFields: [],
      render: ({ data, goTo }) => {
        const nomeCategoria = categorias.find((c) => c.id === data.categoriaId)?.nome ?? ""
        const rotuloExperiencia = OPCOES_EXPERIENCIA.find((o) => o.value === data.experiencia)?.label ?? ""
        const rotuloPreco = FAIXAS_PRECO_DESDE.find((f) => String(f.valor) === data.precoFaixa)?.rotulo ?? ""
        const rotuloDisponibilidade = OPCOES_DISPONIBILIDADE.find((o) => o.value === data.disponibilidade)?.label ?? ""
        const linhas: Array<[string, string]> = [
          ["Tipo de conta", "Profissional"],
          ["Nome", data.nome],
          ["Foto de perfil", data.fotoPerfil?.name ?? ""],
          ["Província", data.provincia],
          ["Município", data.municipio],
          ["Zona ou bairro", data.bairro],
          ["Categoria ou profissão", nomeCategoria],
          ["Especialidades", data.especialidades],
          ["Descrição", data.descricao],
          ["Experiência", rotuloExperiencia],
          ["Preço desde", rotuloPreco],
          ["Disponibilidade", rotuloDisponibilidade],
          ["Fotos de trabalhos", data.fotosTrabalho.length ? `${data.fotosTrabalho.length} foto(s)` : ""],
          ["Telefone", data.telefone],
          ["WhatsApp", data.mesmoNumeroWhatsapp ? data.telefone : data.whatsapp],
        ]
        return (
          <>
            <dl className="grid grid-cols-1 gap-3 text-base sm:grid-cols-2">
              {linhas.map(([rotulo, valor]) => (
                <div key={rotulo} className="flex flex-col">
                  <dt className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">{rotulo}</dt>
                  <dd className="text-neutral-900 dark:text-neutral-50">{valor || "—"}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-2">
              {[
                { etapa: 1, rotulo: "dados pessoais" },
                { etapa: 2, rotulo: "profissão" },
                { etapa: 3, rotulo: "preço" },
                { etapa: 4, rotulo: "contactos" },
              ].map((b) => (
                <button
                  key={b.etapa}
                  type="button"
                  onClick={() => goTo(b.etapa)}
                  className="min-h-11 rounded-[4px] border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 hover:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:text-neutral-50"
                >
                  Editar {b.rotulo}
                </button>
              ))}
            </div>
          </>
        )
      },
    },
  ]
}
