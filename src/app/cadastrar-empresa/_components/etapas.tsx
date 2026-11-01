'use client'

import type { StepDefinition } from '@/components/forms/multi-step/types'
import { TextField, CheckboxField } from '@/components/forms/multi-step/FormFields'
import { SelectField, RadioGroupField, FileField } from '@/components/forms/multi-step/Fields'
import { Button } from '@/components/ui/Button'
import { SETORES_EMPRESA, PROVINCIAS, municipiosDa, FAIXAS_PRECO_DESDE } from '@/lib/listas-selecao'

export type DadosEmpresa = {
  tipoConta: string
  nome: string
  setor: string
  provincia: string
  municipio: string
  bairro: string
  descricao: string
  categorias: string[]
  faixaPreco: string
  logotipo: File | null
  telefone: string
  mesmoNumeroWhatsapp: boolean
  whatsapp: string
  email: string
  website: string
  legalizada: '' | 'sim' | 'nao'
  nif: string
  comprovativo: File | null
}

export const dadosVazios: DadosEmpresa = {
  tipoConta: 'empresa',
  nome: '',
  setor: '',
  provincia: '',
  municipio: '',
  bairro: '',
  descricao: '',
  categorias: [],
  faixaPreco: '',
  logotipo: null,
  telefone: '',
  mesmoNumeroWhatsapp: true,
  whatsapp: '',
  email: '',
  website: '',
  legalizada: '',
  nif: '',
  comprovativo: null,
}

export type CategoriaOpcao = { id: string; nome: string }

const OPCOES_FAIXA = FAIXAS_PRECO_DESDE.map((f) => ({ value: String(f.valor), label: f.rotulo }))

/** Constrói as 6 etapas. Recebe as categorias carregadas da tabela categorias. */
export function buildEtapas(categorias: ReadonlyArray<CategoriaOpcao>): ReadonlyArray<StepDefinition<DadosEmpresa>> {
  return [
    {
      id: 'tipo-conta',
      title: 'Tipo de conta',
      description: 'A sua conta é de empresa. Pode alterar isto mais tarde, antes de publicar.',
      requiredFields: ['tipoConta'],
      render: () => (
        <div className="rounded-[4px] border-2 border-orange-500 bg-orange-50 p-4 dark:bg-orange-950/30">
          <p className="font-heading text-lg font-bold text-neutral-900 dark:text-neutral-50">Empresa</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Registe a sua empresa para aparecer na pesquisa, depois de aprovada pela equipa NegóMapa.
          </p>
        </div>
      ),
    },
    {
      id: 'dados-empresa',
      title: 'Dados da empresa',
      description: 'Localização principal da empresa.',
      requiredFields: ['nome', 'setor', 'provincia', 'municipio'],
      render: ({ data, errors, setField }) => (
        <>
          <TextField id="nome" label="Nome da empresa" value={data.nome} onChange={(v) => setField('nome', v)} required error={errors.nome} />
          <SelectField
            id="setor"
            label="Setor"
            value={data.setor}
            onChange={(v) => setField('setor', v)}
            options={SETORES_EMPRESA}
            required
            error={errors.setor}
          />
          <SelectField
            id="provincia"
            label="Província"
            value={data.provincia}
            onChange={(v) => {
              setField('provincia', v)
              setField('municipio', '')
            }}
            options={PROVINCIAS}
            required
            error={errors.provincia}
          />
          <SelectField
            id="municipio"
            label="Município"
            value={data.municipio}
            onChange={(v) => setField('municipio', v)}
            options={municipiosDa(data.provincia)}
            required
            disabled={!data.provincia}
            hint={data.provincia ? undefined : 'Escolha primeiro a província.'}
            error={errors.municipio}
          />
          <TextField id="bairro" label="Zona ou bairro" value={data.bairro} onChange={(v) => setField('bairro', v)} hint="Opcional." />
        </>
      ),
    },
    {
      id: 'servicos-precos',
      title: 'Serviços e preços',
      description: 'Descreva a empresa e o que oferece.',
      requiredFields: [],
      render: ({ data, setField }) => (
        <>
          <TextField
            id="descricao"
            label="Descrição curta"
            value={data.descricao}
            onChange={(v) => setField('descricao', v)}
            hint="Opcional. Uma ou duas frases sobre a empresa."
          />

          <div className="flex flex-col gap-2">
            <p className="font-heading text-base font-bold text-neutral-900 dark:text-neutral-50">Categorias de serviços</p>
            {categorias.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Não foi possível carregar as categorias.</p>
            ) : (
              categorias.map((c) => (
                <CheckboxField
                  key={c.id}
                  id={`cat-${c.id}`}
                  label={c.nome}
                  checked={data.categorias.includes(c.id)}
                  onChange={(marcada) =>
                    setField(
                      'categorias',
                      marcada ? [...data.categorias, c.id] : data.categorias.filter((x) => x !== c.id)
                    )
                  }
                />
              ))
            )}
          </div>

          <SelectField
            id="faixaPreco"
            label="Preço desde"
            value={data.faixaPreco}
            onChange={(v) => setField('faixaPreco', v)}
            options={OPCOES_FAIXA}
            hint="Opcional."
          />

          <div
            role="note"
            className="rounded-[4px] border border-orange-500 bg-orange-50 p-3 text-sm text-orange-800 dark:bg-orange-950/30 dark:text-orange-200"
          >
            As categorias e a faixa de preço ainda não são guardadas: a base de dados não tem colunas para estes campos.
          </div>

          <FileField
            id="logotipo"
            label="Logótipo"
            file={data.logotipo}
            onChange={(f) => setField('logotipo', f)}
            accept="image/png,image/jpeg,image/webp"
            hint="PNG, JPG ou WebP, até 2 MB. Opcional."
          />
        </>
      ),
    },
    {
      id: 'contactos',
      title: 'Contactos',
      description: 'Estes contactos ficam visíveis na página da empresa depois de aprovada.',
      requiredFields: (d) => ['telefone', 'email', ...(d.mesmoNumeroWhatsapp ? [] : ['whatsapp'])],
      render: ({ data, errors, setField }) => (
        <>
          <TextField id="telefone" label="Telefone" type="tel" value={data.telefone} onChange={(v) => setField('telefone', v)} required error={errors.telefone} />
          <CheckboxField
            id="mesmoNumeroWhatsapp"
            label="Usar o mesmo número no WhatsApp"
            checked={data.mesmoNumeroWhatsapp}
            onChange={(v) => setField('mesmoNumeroWhatsapp', v)}
          />
          {!data.mesmoNumeroWhatsapp && (
            <TextField
              id="whatsapp"
              label="WhatsApp"
              type="tel"
              value={data.whatsapp}
              onChange={(v) => setField('whatsapp', v)}
              required
              error={errors.whatsapp}
            />
          )}
          <TextField id="email" label="Email" type="email" value={data.email} onChange={(v) => setField('email', v)} required error={errors.email} />
          <TextField
            id="website"
            label="Website"
            type="url"
            value={data.website}
            onChange={(v) => setField('website', v)}
            placeholder="https://"
            hint="Opcional."
          />
        </>
      ),
    },
    {
      id: 'legalizacao',
      title: 'Legalização',
      description: 'Uma empresa legalizada tem mais confiança. Pode continuar mesmo sem documento.',
      requiredFields: (d) => ['legalizada', ...(d.legalizada === 'sim' ? ['nif', 'comprovativo'] : [])],
      render: ({ data, errors, setField }) => (
        <>
          <RadioGroupField
            id="legalizada"
            label="A empresa é legalizada?"
            value={data.legalizada}
            onChange={(v) => setField('legalizada', v as DadosEmpresa['legalizada'])}
            options={[
              { value: 'sim', label: 'Sim' },
              { value: 'nao', label: 'Não' },
            ]}
            required
            error={errors.legalizada}
          />
          {data.legalizada === 'sim' && (
            <>
              <TextField id="nif" label="NIF" value={data.nif} onChange={(v) => setField('nif', v)} required error={errors.nif} />
              <FileField
                id="comprovativo"
                label="Comprovativo de legalização"
                file={data.comprovativo}
                onChange={(f) => setField('comprovativo', f)}
                accept="application/pdf,image/png,image/jpeg"
                required
                error={errors.comprovativo}
                hint="PDF, PNG ou JPG, até 10 MB. Fica privado: só a equipa NegóMapa o consulta."
              />
            </>
          )}
          {data.legalizada === 'nao' && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Pode continuar sem documento. A equipa pode pedir a documentação depois da análise.
            </p>
          )}
        </>
      ),
    },
    {
      id: 'revisao',
      title: 'Revisão e envio',
      description: 'Confirme os dados. Use "Editar" para corrigir qualquer etapa.',
      requiredFields: [],
      render: ({ data, goTo }) => {
        const nomesCategorias = categorias.filter((c) => data.categorias.includes(c.id)).map((c) => c.nome)
        const linhas: Array<[string, string, number]> = [
          ['Tipo de conta', 'Empresa', 0],
          ['Nome', data.nome, 1],
          ['Setor', data.setor, 1],
          ['Província', data.provincia, 1],
          ['Município', data.municipio, 1],
          ['Zona ou bairro', data.bairro, 1],
          ['Descrição', data.descricao, 2],
          ['Categorias', nomesCategorias.join(', '), 2],
          ['Preço desde', FAIXAS_PRECO_DESDE.find((f) => String(f.valor) === data.faixaPreco)?.rotulo ?? '', 2],
          ['Logótipo', data.logotipo?.name ?? '', 2],
          ['Telefone', data.telefone, 3],
          ['WhatsApp', data.mesmoNumeroWhatsapp ? data.telefone : data.whatsapp, 3],
          ['Email', data.email, 3],
          ['Website', data.website, 3],
          ['Legalizada', data.legalizada === 'sim' ? 'Sim' : data.legalizada === 'nao' ? 'Não' : '', 4],
          ['NIF', data.nif, 4],
          ['Comprovativo', data.comprovativo?.name ?? '', 4],
        ]
        return (
          <>
            <dl className="grid grid-cols-1 gap-3 text-base sm:grid-cols-2">
              {linhas.map(([rotulo, valor]) => (
                <div key={rotulo} className="flex flex-col">
                  <dt className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">{rotulo}</dt>
                  <dd className="text-neutral-900 dark:text-neutral-50">{valor || '—'}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Button key={i} type="button" variant="ghost" size="sm" onClick={() => goTo(i)}>
                  Editar {ETAPAS_RESUMO[i]}
                </Button>
              ))}
            </div>
            <p className="rounded-[4px] border border-card-border p-3 text-sm text-neutral-700 dark:text-neutral-300">
              Ao enviar, a empresa fica pendente até a equipa NegóMapa aprovar. Não é publicada automaticamente.
            </p>
          </>
        )
      },
    },
  ]
}

const ETAPAS_RESUMO = ['', 'dados', 'serviços', 'contactos', 'legalização', 'revisão']
