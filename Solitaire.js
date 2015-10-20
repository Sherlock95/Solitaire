// Author: Jarrett Locke
// Class: Computer Graphics
//
// Assignment: Create a simple game of solitaire using WebGL (AAAARRRRRGGHGHHHH)
//
// Process:
//      - Create gl object
//      - Initialize viewport, clear color, and program.
//      - Initialize vertex buffer and attribute.
//      - Initialize color buffer and attribute.
//      - do things.
//
// It's really sad when I can find more documentation on WebGL from MSDN
//      than the actual developers of WebGL. >:(
//
// NOTES:
//      WebGL, when rendering 2D, implements depth by saying that things drawn
//          most recently are on top.
//
//      To implement cards: we can imagine that the cards are ordered ace x 4,
//          two x 4, three x 4, etc. This allows us to see that card_index % 2
//          gives us the color (even = black, odd = red) and index / 4 gives us
//          the number (0 = ace, 1 = two, etc.)

var canvas;
var gl;

var vPosition;
var vColor;
var program;
var verticesBuffer;
var verticesColorBuffer;

var drag = false;
var selected = false;

var oldX, oldY;
var deltaX = 0;
var deltaY = 0;

var CARD_WIDTH = 0.2;
var CARD_HEIGHT = 0.5;
var offset = 0.14;

var stacks = [ [], [], [], [], [], [], [], [], [], [], [], [] ];
var stackPos = [];
var deck_position = vec2( -0.981, 0.981 );

var cardVertices = [];
var cardColors = [];
var cards = [];
var deck;
var selectedCards = [];
var selected_Pos;
var prev_pos = [];
var prev_stack;
var deckcard_prev = 0;

var renderOrder = [];

var deck = [];
var selectable = [];

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl )
    {
        alert( "WebGL is not available." );
        return;
    }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.75, 0.0, 1.0 );

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    verticesBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 8 * 312, gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    verticesColorBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, verticesColorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 16 * 312, gl.STATIC_DRAW );

    vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
    
    canvas.addEventListener( "mousedown", mouseDown );
    canvas.addEventListener( "mouseup", mouseUp );
    canvas.addEventListener( "mousemove", mouseMove );

    initCards();

    setInterval( render, 15 );

    function render()
    {
        gl.clear( gl.COLOR_BUFFER_BIT );

        // Push card positions to vertex shader buffer.
        for ( var i = 0; i < renderOrder.length; ++i )
        {
            var index = renderOrder[ i ];
            gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
            var tmp = [
                cardVertices[ index ],
                vec2( cardVertices[ index ][ 0 ] + CARD_WIDTH, cardVertices[ index ][ 1 ] ),
                vec2( cardVertices[ index ][ 0 ], cardVertices[ index ][ 1 ] - CARD_HEIGHT ),
                vec2( cardVertices[ index ][ 0 ] + CARD_WIDTH, cardVertices[ index ][ 1 ] - CARD_HEIGHT ),
                vec2( cardVertices[ index ][ 0 ], cardVertices[ index ][ 1 ] - CARD_HEIGHT ),
                vec2( cardVertices[ index ][ 0 ] + CARD_WIDTH, cardVertices[ index ][ 1 ] )
            ];
            gl.bufferSubData( gl.ARRAY_BUFFER, 48 * i, flatten( tmp ) );
        }

        gl.drawArrays( gl.TRIANGLES, 0, 312 );
    }

    function mouseDown( e )
    {
        // Tell the program that the mouse is pressing down.
        drag = true;
        
        // Get current position of the mouse in terms of WebGL.
        var currX = 2 * e.clientX / canvas.width - 1;
        var currY = 2 * ( canvas.height - e.clientY ) / canvas.height - 1;

        // Find stack that has cursor over it.
        var x_index = -1;
        for ( var i = 0; i < stackPos.length - 5; ++i )
        {
            if ( currX > stackPos[ i ][ 0 ] &&
                 currX < stackPos[ i ][ 0 ] + CARD_WIDTH &&
                 currY < stackPos[ 7 ][ 1 ] - CARD_HEIGHT )
            {
                x_index = 6 - i;
                break;
            }
        }

        if ( x_index == -1 )
        {
            if ( currX > stackPos[ 7 ][ 0 ] &&
                 currX < stackPos[ 7 ][ 0 ] + CARD_WIDTH )
            {
                stacks[ 7 ].push( deck.pop() );
                renderOrder.push( deck[ deck.length - 1 ] );
            }
            return;
        }

        // Find index by taking the y-value of the mouse and finding
        // the stack y-range it falls in.
        var y_index;
        var stack_len = stacks[ x_index ].length;
        var stack_last = stack_len - 1;
        for ( var i = 0; i < stack_len; ++i )
        {
            var test_y = 0.41 - ( offset * i );
            if ( ( currY < test_y && currY > test_y - offset ) ||
                 ( i == stack_last && currY < test_y && currY > test_y - CARD_HEIGHT ) )
            {
                y_index = i;
                break;
            }
        }

        prev_pos[ 0 ] = cardVertices[ stacks[ x_index ][ y_index ] ][ 0 ];
        prev_pos[ 1 ] = cardVertices[ stacks[ x_index ][ y_index ] ][ 1 ];
        prev_stack = x_index;
        
        // Put the card selected and all cards below it into the selected
        // array
        for ( var i = y_index; i < stack_len; ++i )
        {
            selectedCards.push( stacks[ x_index ][ y_index ] );
            renderOrder.splice( renderOrder.indexOf( stacks[ x_index ][ y_index ] ), 1 );
            renderOrder.push( stacks[ x_index ][ y_index ] );
            stacks[ x_index ].splice( y_index, 1 );
        }
    }

    function mouseUp( e )
    {
        drag = false;

        // Get current position of the mouse in terms of WebGL.
        var currX = 2 * e.clientX / canvas.width - 1;
        var currY = 2 * ( canvas.height - e.clientY ) / canvas.height - 1;

        // Search for which stack the cursor is in, ignoring the draw deck.
        var x_index = -1;
        for ( var i = 0; i < stackPos.length - 5; ++i )
        {
            if ( currX > stackPos[ i ][ 0 ] &&
                 currX < stackPos[ i ][ 0 ] + CARD_WIDTH  &&
                 currY < stackPos[ 7 ][ 1 ] - CARD_HEIGHT )
            {
                x_index = 6 - i;
                break;
            }
        }

        if ( x_index == -1 ||
             currY > stackPos[ 6 - x_index ][ 1 ] ||
             currY < ( stackPos[ 6 - x_index ][ 1 ] - ( offset * ( stacks[ x_index ].length - 1 ) ) - CARD_HEIGHT ) )
        {
            for ( var i = 0; i < selectedCards.length; ++i )
            {
                stacks[ prev_stack ].push( selectedCards[ i ] );
                cardVertices[ selectedCards[ i ] ][ 0 ] = prev_pos[ 0 ];
                cardVertices[ selectedCards[ i ] ][ 1 ] = prev_pos[ 1 ] - ( offset * i );
            }

            selectedCards = [];
            prev_stack = -1;
            prev_pos = [];

            return;
        }

        var stack_pos = stacks[ x_index ].length;
        var botcard_num = Math.floor( selectedCards[ 0 ] / 4 );
        var botcard_colr = selectedCards[ 0 ] % 2; // 0 = BLACK, 1 = RED
        var topcard_num = Math.floor( stacks[ x_index ][ stacks[ x_index ].length - 1 ] / 4 );
        var topcard_colr = stacks[ x_index ][ stacks[ x_index ].length - 1 ] % 2;

        // The bitwise XOR is to see if the cards are of a different color.
        if ( !( topcard_colr ^ botcard_colr ) || ( botcard_num + 1 !== topcard_num ) )
        {
            for ( var i = 0; i < selectedCards.length; ++i )
            {
                stacks[ prev_stack ].push( selectedCards[ i ] );
                cardVertices[ selectedCards[ i ] ][ 0 ] = prev_pos[ 0 ];
                cardVertices[ selectedCards[ i ] ][ 1 ] = prev_pos[ 1 ] - ( offset * i );
            }

            selectedCards = [];
            prev_stack = -1;
            prev_pos = [];

            return;
        }
        else
        {
            for ( var i = 0; i < selectedCards.length; ++i )
            {
                stacks[ x_index ].push( selectedCards[ i ] );
            }

            for ( var i = 0; i < selectedCards.length; ++i )
            {
                var card = stacks[ x_index ][ stack_pos + i];
                cardVertices[ card ][ 0 ] = stackPos[ 6 - x_index ][ 0 ];
                cardVertices[ card ][ 1 ] = stackPos[ 6 - x_index ][ 1 ] - ( offset * ( stack_pos + i ) );
            }
        }

        selectedCards = [];
        prev_stack = -1;
        prev_pos = [];
    }

    function mouseMove( e )
    {
        if ( !drag )
        {
            return;
        }

        newX = 2 * e.clientX / canvas.width - 1;
        newY = 2 * ( canvas.height - e.clientY ) / canvas.height - 1;

        for ( var i = 0; i < selectedCards.length; ++i )
        {
            cardVertices[ selectedCards[ i ] ][ 0 ] = newX - CARD_WIDTH / 2;
            cardVertices[ selectedCards[ i ] ][ 1 ] = newY - ( offset * i );
        }
    }

    // Init cards. 
    // Generate a "deck" with the values 0 - 51 in random order.
    // "deal" the cards in specified places ( the rows );
    function initCards()
    {
        // Init stuffs
        deck = [ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 
                    13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 
                    26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 
                    39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51 ];

        for ( var i = 0; i < 52; ++i )
        {
            cardVertices.push( vec2( -0.125, 0.25 ) );
        }

        cardColors.push( vec4( 1.0, 0.0, 0.0, 1.0 ) );
        cardColors.push( vec4( 0.0, 1.0, 0.0, 1.0 ) );
        cardColors.push( vec4( 0.0, 0.0, 1.0, 1.0 ) );
        cardColors.push( vec4( 1.0, 1.0, 1.0, 1.0 ) );

        // Initialize the starting positions for cards in the stacks
        for ( var i = 0; i < 7; ++i )
        {
            stackPos.push( vec2( -0.98 + ( 0.25 * i ), 0.41 ) );
        }

        stackPos.push( vec2( deck_position[ 0 ] + CARD_WIDTH + offset, deck_position[ 1 ] ) );

        for ( var i = 0; i < 4; ++i )
        {
            stackPos.push( vec2( stackPos[ 3 ][ 0 ] + ( 0.25 * i ), deck_position[ 1 ] ) );
        }

        // Shuffle the deck - Modern Fisher-Yates Shuffle Algorithm O( n )
        //      unless Math.random() has a problem.
        // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
        for ( var i = 51; i > 0; --i )
        {
            var index = Math.floor( Math.random() * i );
            var tmp = deck[ i ];
            deck[ i ] = deck[ index ];
            deck[ index ] = tmp;
        }
        
        // Deal out the cards.
        for ( var i = 0; i < 7; ++i )
        {
            stacks[ 0 ].push( deck.pop() );
        }

        for ( var i = 0; i < 6; ++i )
        {
            stacks[ 1 ].push( deck.pop() );
        }

        for ( var i = 0; i < 5; ++i )
        {
            stacks[ 2 ].push( deck.pop() );
        }

        for ( var i = 0; i < 4; ++i )
        {
            stacks[ 3 ].push( deck.pop() );
        }

        for ( var i = 0; i < 3; ++i )
        {
            stacks[ 4 ].push( deck.pop() );
        }

        for ( var i = 0; i < 2; ++i )
        {
            stacks[ 5 ].push( deck.pop() );
        }

        stacks[ 6 ].push( deck.pop() );

        // Record the position of the cards in the stacks.

        // Stack 1
        cardVertices[ stacks[ 6 ][ 0 ] ] = vec2( stackPos[ 0 ][ 0 ], stackPos[ 0 ][ 1 ] );

        // Stack 2
        for ( var i = 0; i < 2; ++i )
        {
            cardVertices[ stacks[ 5 ][ i ] ] = vec2( stackPos[ 1 ][ 0 ], stackPos[ 1 ][ 1 ] - ( offset * i ) );
        }

        // Stack 3
        for ( var i = 0; i < 3; ++i )
        {
            cardVertices[ stacks[ 4 ][ i ] ] = vec2( stackPos[ 2 ][ 0 ], stackPos[ 2 ][ 1 ] - ( offset * i ) );
        }

        // Stack 4
        for ( var i = 0; i < 4; ++i )
        {
            cardVertices[ stacks[ 3 ][ i ] ] = vec2( stackPos[ 3 ][ 0 ], stackPos[ 3 ][ 1 ] - ( offset * i ) );
        }

        // Stack 5
        for ( var i = 0; i < 5; ++i )
        {
            cardVertices[ stacks[ 2 ][ i ] ] = vec2( stackPos[ 4 ][ 0 ], stackPos[ 4 ][ 1 ] - ( offset * i ) );
        }

        // Stack 6
        for ( var i = 0; i < 6; ++i )
        {
            cardVertices[ stacks[ 1 ][ i ] ] = vec2( stackPos[ 5 ][ 0 ], stackPos[ 5 ][ 1 ] - ( offset * i ) );
        }

        // Stack 7
        for ( var i = 0; i < 7; ++i )
        {
            cardVertices[ stacks[ 0 ][ i ] ] = vec2( stackPos[ 6 ][ 0 ], stackPos[ 6 ][ 1 ] - ( offset * i ) );
        }

        // Record position of the deck.
        for ( var i = 0; i < deck.length; ++i )
        {
            cardVertices[ deck[ i ] ] = deck_position;
        }

        // Render order Deck < Stacks
        // Only need to render top card in deck.
        renderOrder.push( deck[ deck.length - 1 ] );

        for ( var i = 0; i < 7; ++i )
        {
            renderOrder.push( stacks[ i ][ 0 ] );
        }

        for ( var i = 0; i < 6; ++i )
        {
            renderOrder.push( stacks[ i ][ 1 ] );
        }

        for ( var i = 0; i < 5; ++i )
        {
            renderOrder.push( stacks[ i ][ 2 ] );
        }

        for ( var i = 0; i < 4; ++i )
        {
            renderOrder.push( stacks[ i ][ 3 ] );
        }

        for ( var i = 0; i < 3; ++i )
        {
            renderOrder.push( stacks[ i ][ 4 ] );
        }

        for ( var i = 0; i < 2; ++i )
        {
            renderOrder.push( stacks[ i ][ 5 ] );
        }

        renderOrder.push( stacks[ 0 ][ 6 ] );


        for ( var i = 0; i < renderOrder.length; ++i )
        {
            var index = renderOrder[ i ];
            gl.bindBuffer( gl.ARRAY_BUFFER, verticesColorBuffer );
            var tmp = [
                cardColors[ i % 4 ],
                cardColors[ i % 4 ],
                cardColors[ i % 4 ],
                cardColors[ i % 4 ],
                cardColors[ i % 4 ],
                cardColors[ i % 4 ]
            ];
            gl.bufferSubData( gl.ARRAY_BUFFER, 96 * i, flatten( tmp ) );
        }
    }
};
