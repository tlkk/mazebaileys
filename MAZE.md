# Baileys - edição maze

Fork do Baileys (WhiskeySockets) mantido por **maze**. Crédito do projeto original: Rajeh Taher / WhiskeySockets (licença MIT, veja `LICENSE`).

## O que foi adicionado

- Botões clássicos (`buttons`)
- Lista de seleção (`sections`)
- Botões nativos / mensagem interativa (`interactiveButtons`): resposta rápida, link, ligar, copiar, localização e menu de seleção
- Carrossel de cards (`cards`)
- `sock.sendAlbum(jid, itens)`: várias imagens/vídeos como álbum
- Nós `biz`/`bot` enviados automaticamente para botões e listas aparecerem no app
- `getSelectedButtonId(msg.message)`: lê o id escolhido em qualquer tipo de resposta (botão, lista, nativo)
- Correção: `assertColor` não retornava valor quando a cor era número (afetava `backgroundColor` em texto de status)

## Exemplos

```ts
import { MazeButtons, getSelectedButtonId } from 'baileys'

// botões nativos (resposta rápida, link, copiar)
await sock.sendMessage(jid, {
	text: 'Escolha uma opção',
	footer: 'maze',
	interactiveButtons: [
		MazeButtons.quickReply('Menu', 'menu'),
		MazeButtons.url('Site', 'https://exemplo.com'),
		MazeButtons.copy('Copiar Pix', 'chave-pix-aqui')
	]
})

// botões clássicos com imagem no cabeçalho
await sock.sendMessage(jid, {
	image: { url: './foto.jpg' },
	text: 'Legenda',
	buttons: [{ buttonId: 'a', buttonText: { displayText: 'Opção A' } }]
})

// lista
await sock.sendMessage(jid, {
	text: 'Menu',
	buttonText: 'Abrir',
	sections: [{ title: 'Comandos', rows: [{ title: 'Play', rowId: 'play', description: 'Toca música' }] }]
})

// carrossel
await sock.sendMessage(jid, {
	text: 'Destaques',
	cards: [{ image: { url: './a.jpg' }, title: 'Card 1', body: 'Texto', buttons: [MazeButtons.quickReply('Ver', 'c1')] }]
})

// álbum
await sock.sendAlbum(jid, [{ image: { url: './1.jpg' }, caption: 'foto 1' }, { video: { url: './2.mp4' } }])

// ler o clique
sock.ev.on('messages.upsert', ({ messages }) => {
	const id = getSelectedButtonId(messages[0]?.message)
	if (id) console.log('clicou em', id)
})
```

## Aviso

Botões, listas e carrossel dependem do que o WhatsApp aceitar no momento (versão do app, tipo de conta, conversa privada ou grupo). O que funciona hoje pode parar de funcionar depois de uma atualização do WhatsApp.
