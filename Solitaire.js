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
    }

    //NOTE: 0 - 6 are field stacks, 7 is draw deck, 8 - 11 are the finish stacks
    function mouseUp( e )
    {
        drag = false;

        // Get current position of the mouse in terms of WebGL.
        var currX = 2 * e.clientX / canvas.width - 1;
        var currY = 2 * ( canvas.height - e.clientY ) / canvas.height - 1;

        // Find the stack that the cursor is currently over, ignore draw deck.
        var x_index = -1;
        if ( currY < stackPos[ 7 ][ 1 ] && currY > stackPos[ 7 ][ 1 ] - CARD_HEIGHT )
        {
            for ( var i = 8; i < stackPos.length; ++i )
            {
                if ( currX > stackPos[ i ][ 0 ] &&
                     currX < stackPos[ i ][ 0 ] + CARD_WIDTH )
                {
                    x_index = i;
                }
            }
        }
        else
        {

        }
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

        // Initialize the stacks.
        stacks[ 0 ].push( deck.pop() );

        for ( var i = 0; i < 2; ++i )
        {
            stacks[ 1 ].push( deck.pop() );
        }

        for ( var i = 0; i < 3; ++i )
        {
            stacks[ 2 ].push( deck.pop() );
        }

        for ( var i = 0; i < 4; ++i )
        {
            stacks[ 3 ].push( deck.pop() );
        }

        for ( var i = 0; i < 5; ++i )
        {
            stacks[ 4 ].push( deck.pop() );
        }

        for ( var i = 0; i < 6; ++i )
        {
            stacks[ 5 ].push( deck.pop() );
        }

        for ( var i = 0; i < 7; ++i )
        {
            stacks[ 6 ].push( deck.pop() );
        }

        for ( var i = 0; i < 52; ++i )
        {
            cardVertices.push( vec2( -0.125, 0.25 ) );
        }

        cardColors.push( vec4( 1.0, 0.0, 0.0, 1.0 ) );
        cardColors.push( vec4( 0.0, 1.0, 0.0, 1.0 ) );
        cardColors.push( vec4( 0.0, 0.0, 1.0, 1.0 ) );
        cardColors.push( vec4( 1.0, 1.0, 1.0, 1.0 ) );

        // var deck_position = vec2( -0.981, 0.981 );
        // Initialize inital deck positions
        for ( var i = 0; i < 7; ++i )
        {
            stackPos[ i ] = vec2( -0.981 + ( i * ( CARD_WIDTH + offset ) ), 0.41 );
        }

        stackPos[ 7 ] = vec2( -0.981, -0.981 );

        for ( var i = 0; i < 4; ++i )
        {
            stackPos[ 8 + i ] = vec2( -0.23 + ( i * ( CARD_WIDTH + offset ) ), 0.981 );
        }
    }
};
