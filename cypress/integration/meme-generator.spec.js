import 'cypress-file-upload';

const evaluateOffset = (doc, selector, offsetType) => {
  return doc.querySelector(selector).getBoundingClientRect()[`${offsetType}`];
};

const isOnSameHorizontal = (firstElement, secondElement) =>
  (firstElement.top >= secondElement.top &&
    firstElement.bottom <= secondElement.bottom) ||
  (secondElement.top >= firstElement.top && secondElement.bottom <= firstElement.bottom);

const isOnSameVertical = (firstElement, secondElement) =>
  (firstElement.left >= secondElement.left &&
    firstElement.right <= secondElement.right) ||
  (secondElement.left >= firstElement.left && secondElement.right <= firstElement.right);

const isOverEachother = (backgroundElement, forefrontElement) => {
  backgroundElement.bottom = backgroundElement.top + backgroundElement.height;
  backgroundElement.right = backgroundElement.left + backgroundElement.width;

  forefrontElement.bottom = forefrontElement.top + forefrontElement.height;
  forefrontElement.right = forefrontElement.left + forefrontElement.width;

  return (
    isOnSameHorizontal(backgroundElement, forefrontElement) &&
    isOnSameVertical(backgroundElement, forefrontElement)
  );
};

describe('Meme generator', function () {
  const checkFullOverlappage = (backgroundSelector, forefrontSelector) => {
    cy.document().then(doc => {
      const backgroundElement = {
        top: evaluateOffset(doc, backgroundSelector, 'top'),
        height: evaluateOffset(doc, backgroundSelector, 'height'),
        left: evaluateOffset(doc, backgroundSelector, 'left'),
        width: evaluateOffset(doc, backgroundSelector, 'width'),
      };

      const forefrontElement = {
        top: evaluateOffset(doc, forefrontSelector, 'top'),
        height: evaluateOffset(doc, forefrontSelector, 'height'),
        left: evaluateOffset(doc, forefrontSelector, 'left'),
        width: evaluateOffset(doc, forefrontSelector, 'width'),
      };

      expect(isOverEachother(backgroundElement, forefrontElement)).to.be.true;

      // Text has volume
      expect(forefrontElement.top).to.not.be.undefined;
      expect(forefrontElement.bottom).to.not.be.undefined;
      expect(forefrontElement.left).to.not.be.undefined;
      expect(forefrontElement.right).to.not.be.undefined;
      expect(forefrontElement.right != forefrontElement.left).to.be.true;
      expect(forefrontElement.top != forefrontElement.bottom).to.be.true;
    });
  };

  const typeTextAndCheckItsPosition = (container, child) => {
    // It inserts text in the input and page when typed
    cy.get('#text-input')
      .type('My awesome meme')
      .should('have.value', 'My awesome meme');

    cy.contains(/^My awesome meme$/).should('be.visible');

    // Has one element inside another
    checkFullOverlappage(container, child);
  };

  const memeUpload = () => {
    const fileName = 'meme.jpeg';
    cy.fixture(fileName).then(fileContent => {
      cy.get('#meme-insert').upload({
        fileContent,
        fileName,
        mimeType: 'image/jpeg',
      });
    });
  };

  it("O site deve possuir uma caixa de texto com a qual quem usa pode interagir para inserir texto em cima da imagem escolhida.", function () {
    cy.viewport(1366, 768);
    cy.visit('/');

    typeTextAndCheckItsPosition('#meme-image-container', '#meme-text');
  });

  it("O site deve permitir que quem usa faça upload de uma imagem de seu computador.", function () {
    cy.viewport(1366, 768);
    cy.visit('/');

    memeUpload();
    cy.get('#meme-image').should('be.visible');
    typeTextAndCheckItsPosition('#meme-image', '#meme-text');
  });

  it("O site deve ter uma moldura no container. A moldura deve ter 1 pixel de largura, deve ser preta e do tipo 'solid'. A área onde a imagem aparecerá deve ter fundo branco.", function () {
    cy.viewport(1366, 768);
    cy.visit('/');
    cy.reload();

    // Image container has a white background
    cy.get('#meme-image-container').should($container => {
      expect($container).to.have.css('background-color', 'rgb(255, 255, 255)');
    });

    cy.get('#meme-image-container').should(
      'have.css',
      'border',
      '1px solid rgb(0, 0, 0)',
    );

    // Image is precisely inside it's container
    memeUpload();
    checkFullOverlappage('#meme-image-container', '#meme-image');
  });

  it("O texto que será inserido sobre a imagem deve ter uma cor, sombra e tamanho específicos.", function () {
    cy.viewport(1366, 768);
    cy.visit('/');
    cy.reload();

    // Image container has a white background
    cy.get('#meme-text').should($text => {
      expect($text).to.have.css('text-shadow', 'rgb(0, 0, 0) 5px 5px 5px');
    });

    cy.get('#meme-text').should(
      'have.css',
      'font-size',
      '30px',
    );

    cy.get('#meme-text').should(
      'have.css',
      'color',
      'rgb(255, 255, 255)',
    );

    // Image is precisely inside it's container
    memeUpload();
    checkFullOverlappage('#meme-image-container', '#meme-image');
  });

  it("Limite o tamanho do texto que o usuário pode inserir.", function () {
    cy.get('#text-input')
      .type('I have written a line that has precisely sixty-one characters')
      .should(
        'have.value',
        'I have written a line that has precisely sixty-one character',
      );
  });

  // Bonus requirements

  it("Permita a quem usa customizar o meme escolhido acrescentando a ele uma de três bordas. A página deve ter três botões, que ao serem clicados devem cada um trocar a própria borda ao redor do container.", function () {
    cy.viewport(1366, 768);
    cy.visit('/');

    cy.get('#fire').should(
      'have.css',
      'background-color',
      'rgb(255, 0, 0)',
    );
    cy.get('#fire').click();
    cy.get('#meme-image-container').should(
      'have.css',
      'border',
      '3px dashed rgb(255, 0, 0)',
    );

    cy.get('#water').should(
      'have.css',
      'background-color',
      'rgb(0, 0, 255)',
    );
    cy.get('#water').click();
    cy.get('#meme-image-container').should(
      'have.css',
      'border',
      '5px double rgb(0, 0, 255)',
    );

    cy.get('#earth').should(
      'have.css',
      'background-color',
      'rgb(0, 128, 0)',
    );
    cy.get('#earth').click();
    cy.get('#meme-image-container').should(
      'have.css',
      'border',
      '6px groove rgb(0, 128, 0)',
    );
  });

  it("Tenha um conjunto de quatro imagens pré prontas de memes famosos para o usuário escolher. Mostre miniaturas das imagens e, mediante clique do usuário, essa imagem deve aparecer dentro da moldura do elemento de container.", function () {
    cy.viewport(1366, 768);
    cy.visit('/');

    [1, 2, 3, 4].map(memeId => {
      cy.get(`#meme-${memeId}`).click();
      cy.get('#meme-image')
        .should('have.attr', 'src')
        .and('match', new RegExp(`imgs/meme${memeId}.png$`));
    });
  });
});
