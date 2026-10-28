import type { proto } from '../../WAProto/index.js'
import type { BinaryNode } from '../WABinary'

/**
 * Botões nativos (native flow). Cada helper devolve um item para `interactiveButtons`.
 */
export type NativeFlowButton = { name: string; buttonParamsJson: string }

const json = (value: unknown) => JSON.stringify(value)

export const MazeButtons = {
	/** Botão de resposta rápida: devolve `id` quando clicado */
	quickReply: (displayText: string, id: string): NativeFlowButton => ({
		name: 'quick_reply',
		buttonParamsJson: json({ display_text: displayText, id })
	}),
	/** Botão que abre um link */
	url: (displayText: string, url: string): NativeFlowButton => ({
		name: 'cta_url',
		buttonParamsJson: json({ display_text: displayText, url, merchant_url: url })
	}),
	/** Botão que liga para um número */
	call: (displayText: string, phoneNumber: string): NativeFlowButton => ({
		name: 'cta_call',
		buttonParamsJson: json({ display_text: displayText, phone_number: phoneNumber })
	}),
	/** Botão que copia um texto (ex.: código, chave Pix) */
	copy: (displayText: string, copyCode: string): NativeFlowButton => ({
		name: 'cta_copy',
		buttonParamsJson: json({ display_text: displayText, copy_code: copyCode })
	}),
	/** Botão que pede a localização do usuário */
	sendLocation: (displayText = 'Enviar localização'): NativeFlowButton => ({
		name: 'send_location',
		buttonParamsJson: json({ display_text: displayText })
	}),
	/** Menu de seleção (lista dentro de botão) */
	singleSelect: (
		title: string,
		sections: { title?: string; highlight_label?: string; rows: { id: string; title: string; description?: string }[] }[]
	): NativeFlowButton => ({
		name: 'single_select',
		buttonParamsJson: json({ title, sections })
	})
}

/** Nomes de botões nativos que precisam de um nó `native_flow` específico no stanza */
const NATIVE_FLOW_SPECIALS = [
	'mpm',
	'cta_catalog',
	'send_location',
	'call_permission_request',
	'wa_payment_transaction_details',
	'automated_greeting_message_view_catalog'
]

/**
 * Descobre se a mensagem é de botões/lista/interativa e devolve o tipo.
 * Retorna `undefined` para mensagens normais.
 */
export const getInteractiveType = (message: proto.IMessage): 'list' | 'buttons' | 'native_flow' | undefined => {
	if (message.listMessage) return 'list'
	if (message.buttonsMessage) return 'buttons'
	if (message.interactiveMessage?.nativeFlowMessage || message.interactiveMessage?.carouselMessage) {
		return 'native_flow'
	}

	return undefined
}

/**
 * Monta os nós extras (`biz` e, em conversa privada, `bot`) que o WhatsApp exige
 * para renderizar botões, listas e mensagens interativas.
 */
export const getInteractiveNodes = (message: proto.IMessage, isPrivateChat: boolean): BinaryNode[] => {
	const type = getInteractiveType(message)
	if (!type) return []

	const nativeFlow = message.interactiveMessage?.nativeFlowMessage
	const firstButtonName = nativeFlow?.buttons?.[0]?.name || ''

	let biz: BinaryNode
	if (type === 'list') {
		biz = {
			tag: 'biz',
			attrs: {},
			content: [{ tag: 'list', attrs: { v: '2', type: 'product_list' } }]
		}
	} else if (nativeFlow && (firstButtonName === 'review_and_pay' || firstButtonName === 'payment_info')) {
		biz = {
			tag: 'biz',
			attrs: { native_flow_name: firstButtonName === 'review_and_pay' ? 'order_details' : firstButtonName }
		}
	} else if (nativeFlow && NATIVE_FLOW_SPECIALS.includes(firstButtonName)) {
		biz = {
			tag: 'biz',
			attrs: {},
			content: [
				{
					tag: 'interactive',
					attrs: { type: 'native_flow', v: '1' },
					content: [{ tag: 'native_flow', attrs: { v: '2', name: firstButtonName } }]
				}
			]
		}
	} else {
		biz = {
			tag: 'biz',
			attrs: {},
			content: [
				{
					tag: 'interactive',
					attrs: { type: 'native_flow', v: '1' },
					content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
				}
			]
		}
	}

	const nodes: BinaryNode[] = [biz]
	if (isPrivateChat) {
		nodes.push({ tag: 'bot', attrs: { biz_bot: '1' } })
	}

	return nodes
}

/**
 * Extrai o id escolhido pelo usuário de qualquer tipo de resposta:
 * botão simples, botão de template, lista e botão nativo (quick_reply / single_select).
 * Aceita a mensagem já normalizada (`msg.message`).
 */
export const getSelectedButtonId = (message: proto.IMessage | null | undefined): string | undefined => {
	if (!message) return undefined

	const buttons = message.buttonsResponseMessage
	if (buttons?.selectedButtonId) return buttons.selectedButtonId

	const template = message.templateButtonReplyMessage
	if (template?.selectedId) return template.selectedId

	const list = message.listResponseMessage
	if (list?.singleSelectReply?.selectedRowId) return list.singleSelectReply.selectedRowId

	const params = message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
	if (params) {
		try {
			const parsed = JSON.parse(params) as { id?: string; selected_row_id?: string }
			return parsed.id ?? parsed.selected_row_id
		} catch {
			return undefined
		}
	}

	return undefined
}
