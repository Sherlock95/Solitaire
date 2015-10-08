window.onload = function init()
{
    var canvas;
    var gl;

    var vPosition;
    var vColor;
    var program;
    var verticesBuffer;
    var verticesColorBuffer;
    var perspectiveMatrix;

    var lastSquareUpdateTime;

    var drag = false;
    var selected = false;

    var oldX, oldY;
    var deltaX = 0;
    var deltaY = 0;

    var vertices;

    canvas = document.getElementById( "gl-canvas" );

    var gl = initWebGL( canvas );

    if ( gl ) {
        gl.clearColor( 0.165, 0.714, 0.043, 1.0 );
        gl.enable( gl.DEPTH_TEST );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        gl.viewport( 0, 0, canvas.width, canvas.height );
    }

    initShaders();
    initBuffers();

    setInterval( render, 15 );

    function render() 
    {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        perspectiveMatrix = makePerspective( 45, canvas.width/canvas.height, 0.1, 100.0 );

        loadIdentity();
        mvTranslate( [ -0.0, 0.0, -6.0 ] );

        mvPushMatrix();
        mvTranslate( [ deltaX, deltaY, 0 ] );

        gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
        gl.bindBuffer( gl.ARRAY_BUFFER, verticesColorBuffer );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );

        setMatrixUniforms();
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

        mvPopMatrix();
    }

    function initWebGL( canvas ) 
    {
        gl = null;

        gl = canvas.getContext( "webgl" );

        if ( !gl ) 
        {
            alert( "Unable to initialize webgl." );
        }

        canvas.addEventListener( "mousedown", mouseDown, false );
        canvas.addEventListener( "mouseup", mouseUp, false );
        canvas.addEventListener( "mousemove", mouseMove, false );

        return gl;
    }

    function initShaders()
    {
        var vertexShader = getShader( gl, "vertex-shader" );
        var fragmentShader = getShader( gl, "fragment-shader" );

        shaderProgram = gl.createProgram();
        gl.attachShader( shaderProgram, vertexShader );
        gl.attachShader( shaderProgram, fragmentShader );
        gl.linkProgram( shaderProgram );

        if ( !gl.getProgramParameter( shaderProgram, gl.LINK_STATUS ) )
        {
            alert( "Unable to initialize the shader program." );
        }

        gl.useProgram( shaderProgram );

        vPosition = gl.getAttribLocation( shaderProgram, "vPosition" );
        gl.enableVertexAttribArray( vPosition );

        vColor = gl.getAttribLocation( shaderProgram, "vColor" );
        gl.enableVertexAttribArray( vColor );
    }

    function initBuffers() {
        verticesBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );

        vertices = [
            1.0, 1.0, 0.0,
            -1.0, 1.0, 0.0,
            1.0, -1.0, 0.0,
            -1.0, -1.0, 0.0 ];

        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );

        var colors = [
            1.0, 1.0, 1.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 1.0 ];

        verticesColorBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, verticesColorBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( colors ), gl.STATIC_DRAW );
    }

    function getShader( gl, id )
    {
        var shaderScript, theSource, currentChild, shader;

        shaderScript = document.getElementById( id );

        if ( !shaderScript )
        {
            return null;
        }

        theSource = "";
        currentChild = shaderScript.firstChild;

        while ( currentChild )
        {
            if ( currentChild.nodeType == currentChild.TEXT_NODE )
            {
                theSource += currentChild.textContent;
            }

            currentChild = currentChild.nextSibling;
        }

        if ( shaderScript.type == "x-shader/x-fragment" )
        {
            shader = gl.createShader( gl.FRAGMENT_SHADER );
        }
        else if ( shaderScript.type == "x-shader/x-vertex" )
        {
            shader = gl.createShader( gl.VERTEX_SHADER );
        }
        else
        {
            return null;
        }

        gl.shaderSource( shader, theSource );

        gl.compileShader( shader );

        if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) )
        {
            alert( "An error occurred while compiling shaders: " + gl.getShaderInfoLog( shader ) );
            return null;
        }

        return shader
    }

    function mouseDown( e ) 
    {
        drag = true;

        oldX = e.clientX;
        oldY = e.clientY;
        
        document.getElementById( "debug" ).text = "drag = " + drag + " selected = " + selected;

        e.preventDefault();
    }

    function mouseUp( e )
    {
        drag = false;
        e.preventDefault();
    }

    function mouseMove( e ) 
    {
        if ( !drag )
        {
            return;
        }

        var newX = e.clientX;
        var newY = e.clientY;

        deltaX = newX - oldX;
        deltaY = newY - oldY;

        e.preventDefault();
    }

    var mvMatrixStack = [];

    function mvPushMatrix(m) {
        if (m) {
            mvMatrixStack.push(m.dup());
            mvMatrix = m.dup();
        } else {
            mvMatrixStack.push(mvMatrix.dup());
        }
    }

    function mvPopMatrix() {
        if (!mvMatrixStack.length) {
            throw("Can't pop from an empty matrix stack.");
        }

        mvMatrix = mvMatrixStack.pop();
        return mvMatrix;
    }

    function mvRotate(angle, v) {
        var inRadians = angle * Math.PI / 180.0;

        var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
        multMatrix(m);
    }

    function loadIdentity() {
        mvMatrix = Matrix.I(4);
    }

    function multMatrix(m) {
        mvMatrix = mvMatrix.x(m);
    }

    function mvTranslate(v) {
        multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
    }

    function setMatrixUniforms() {
        var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

        var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
    }
};
