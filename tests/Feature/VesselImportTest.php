<?php

use Illuminate\Http\UploadedFile;

test('it can import vessels', function () {
    $this->withoutExceptionHandling();
    $this->withoutMiddleware();

    $file = UploadedFile::fake()->create('test.csv', 100, 'text/csv');

    $response = $this->post('/admin/vessels/import', [
        'file' => $file,
    ]);

    $response->assertStatus(302);
});
