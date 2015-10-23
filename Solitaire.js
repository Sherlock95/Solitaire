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
//
//      Only allow cards to be placed on another face-up card. Do not allow for
//          putting cards on the stack to place them in the stack. Must place
//          cards on the last card in stack for them to combine into one stack.

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

var CARD_WIDTH = 0.15;
var CARD_HEIGHT = 0.4;
var offset = 0.15;

var deck = []; // holds index for all cards.
var card_x = []; // holds x values for all cards
var card_y = []; // holds y values for all cards
var stacks = [ [], [], [], [], [], [], 
               [], [], [], [], [], [] ]; // holds the index of cards in stacks.
var stack_pos = []; // holds positions of the stacks.
var render_card = []; // holds index of cards being rendered
var render_vertices = []; // holds the position of cards being rendered
var face_up = []; // tells you which cards that are being rendered are face up
var place_pos = []; // tells which positions are legal for placement.
var click_pos = []; // tells which positions can be clicked.

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

    init();

    setInterval( render, 15 );

    function render()
    {
        gl.clear( gl.COLOR_BUFFER_BIT );

        // Push card positions to vertex shader buffer.
        for ( var i = 0; i < renderOrder.length; ++i )
        {
            gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
            var tmp = [
                cardVertices[ renderOrder[ i ] ],
                vec2( cardVertices[ renderOrder[ i ] ][ 0 ] + CARD_WIDTH, 
                        cardVertices[ renderOrder[ i ] ][ 1 ] ),
                vec2( cardVertices[ renderOrder[ i ] ][ 0 ], 
                        cardVertices[ renderOrder[ i ] ][ 1 ] - CARD_HEIGHT ),
                vec2( cardVertices[ renderOrder[ i ] ][ 0 ] + CARD_WIDTH,
                        cardVertices[ renderOrder[ i ] ][ 1 ] - CARD_HEIGHT ),
                vec2( cardVertices[ renderOrder[ i ] ][ 0 ], 
                        cardVertices[ renderOrder[ i ] ][ 1 ] - CARD_HEIGHT ),
                vec2( cardVertices[ renderOrder[ i ] ][ 0 ] + CARD_WIDTH, 
                        cardVertices[ index ][ 1 ] )
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
    }

    //NOTE: 0 - 6 are field stacks, 7 is draw deck, 8 - 11 are the finish stacks
    function mouseUp( e )
    {
        drag = false;

        // Get current position of the mouse in terms of WebGL.
        var currX = 2 * e.clientX / canvas.width - 1;
        var currY = 2 * ( canvas.height - e.clientY ) / canvas.height - 1;
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
    function init()
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

        // Init the card positions in the deck's initial position.
        for ( var i = 0; i < 52; ++i )
        {
            card_x[ i ] = -offset;
            card_y[ i ] = offset;
        }

        // edit in order:
        stacks = [];
        stack_pos = [];
        card_x = []; 
        card_y = []; 
        render_card = []; 
        render_vertices = []; 
        face_up = []; 
        place_pos = []; 
        click_pos = []; 
    }
};
